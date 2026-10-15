import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { LlmProvider, LlmProviderError } from '../llm.provider.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiPart {
  text?: unknown;
}

interface GeminiCandidate {
  content?: {
    parts?: unknown;
  };
}

interface GeminiPayload {
  candidates?: unknown;
}

@Injectable()
export class GeminiLlmProvider extends LlmProvider {
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly timeoutMs: number;

  get modelName(): string {
    return this.model;
  }

  constructor(
    configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    super();
    this.logger.setContext(GeminiLlmProvider.name);
    const key = configService.get<string>('GEMINI_API_KEY');
    this.apiKey = typeof key === 'string' && key.length > 0 ? key : undefined;
    this.model = configService.getOrThrow<string>('GEMINI_MODEL');
    this.timeoutMs = Number(
      configService.getOrThrow<string>('GEMINI_TIMEOUT_MS'),
    );
  }

  private assertConfigured(): string {
    if (!this.apiKey) {
      throw new LlmProviderError(
        'unreachable',
        'Gemini API key is not configured',
      );
    }
    return this.apiKey;
  }

  async chat(prompt: string): Promise<string> {
    const apiKey = this.assertConfigured();
    let response: Response;
    try {
      response = await fetch(this.buildUrl('generateContent'), {
        method: 'POST',
        headers: this.headers(apiKey),
        body: JSON.stringify(this.payload(prompt)),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw this.toProviderError(error);
    }

    const payload = await this.readJson(response);
    const text = this.extractText(payload);
    if (text.trim() === '') {
      throw new LlmProviderError('bad_response', 'Empty text response');
    }
    return text;
  }

  async *chatStream(prompt: string): AsyncGenerator<string, void, void> {
    const apiKey = this.assertConfigured();
    let response: Response;
    try {
      response = await fetch(this.buildUrl('streamGenerateContent?alt=sse'), {
        method: 'POST',
        headers: this.headers(apiKey),
        body: JSON.stringify(this.payload(prompt)),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw this.toProviderError(error);
    }

    this.throwForStatus(response);
    if (!response.body) {
      throw new LlmProviderError('bad_response', 'Empty stream body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      let finished = false;
      let chunk = await reader.read();
      while (!chunk.done && !finished) {
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const parsed = this.parseStreamLine(line);
          if (parsed.delta !== null) {
            yield parsed.delta;
          }
          if (parsed.finished) {
            finished = true;
            break;
          }
        }
        if (!finished) {
          chunk = await reader.read();
        }
      }

      if (!finished && buffer.trim() !== '') {
        const parsed = this.parseStreamLine(buffer);
        if (parsed.delta !== null) {
          yield parsed.delta;
        }
      }
    } catch (error) {
      if (error instanceof LlmProviderError) {
        throw error;
      }
      throw this.toProviderError(error);
    } finally {
      await reader.cancel().catch(() => undefined);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.chat('ping');
      return true;
    } catch (error) {
      const reason =
        error instanceof LlmProviderError ? error.reason : 'unreachable';
      this.logger.warn({ reason, model: this.model });
      return false;
    }
  }

  private buildUrl(action: string): string {
    return `${GEMINI_BASE_URL}/${this.model}:${action}`;
  }

  private headers(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    };
  }

  private payload(prompt: string): object {
    return {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    };
  }

  private async readJson(response: Response): Promise<GeminiPayload> {
    this.throwForStatus(response);
    try {
      return (await response.json()) as GeminiPayload;
    } catch {
      throw new LlmProviderError('bad_response', 'Invalid JSON response');
    }
  }

  private extractText(payload: GeminiPayload): string {
    const candidate = Array.isArray(payload.candidates)
      ? (payload.candidates[0] as GeminiCandidate | undefined)
      : undefined;
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) {
      throw new LlmProviderError('bad_response', 'Missing Gemini text parts');
    }

    return parts
      .map((part) => (part as GeminiPart).text)
      .filter((text): text is string => typeof text === 'string')
      .join('');
  }

  private parseStreamLine(line: string): {
    delta: string | null;
    finished: boolean;
  } {
    const text = line.trim();
    if (text === '' || text.startsWith(':')) {
      return { delta: null, finished: false };
    }

    const data = text.startsWith('data:')
      ? text.slice('data:'.length).trim()
      : text;
    if (data === '[DONE]') {
      return { delta: null, finished: true };
    }

    let payload: GeminiPayload;
    try {
      payload = JSON.parse(data) as GeminiPayload;
    } catch {
      throw new LlmProviderError('bad_response', 'Invalid stream chunk');
    }

    const candidate = Array.isArray(payload.candidates)
      ? (payload.candidates[0] as GeminiCandidate | undefined)
      : undefined;
    const parts = candidate?.content?.parts;
    const delta = Array.isArray(parts)
      ? parts
          .map((part) => (part as GeminiPart).text)
          .filter((value): value is string => typeof value === 'string')
          .join('')
      : '';

    return { delta: delta === '' ? null : delta, finished: false };
  }

  private throwForStatus(response: Response): void {
    if (response.ok) {
      return;
    }
    if (response.status === 429) {
      throw new LlmProviderError(
        'rate_limited',
        `Gemini rate limit exceeded for model ${this.model}`,
      );
    }
    if (response.status === 413) {
      throw new LlmProviderError(
        'payload_too_large',
        `Gemini request payload too large for model ${this.model}`,
      );
    }
    if (response.status === 404) {
      throw new LlmProviderError(
        'model_not_found',
        `Model ${this.model} not found`,
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new LlmProviderError(
        'unreachable',
        `Gemini request rejected with status ${response.status}`,
      );
    }
    throw new LlmProviderError(
      'bad_response',
      `Unexpected status ${response.status}`,
    );
  }

  private toProviderError(error: unknown): LlmProviderError {
    if (
      error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TimeoutError')
    ) {
      return new LlmProviderError('timeout', 'Request timed out');
    }
    return new LlmProviderError(
      'unreachable',
      error instanceof Error ? error.message : 'Request failed',
    );
  }
}
