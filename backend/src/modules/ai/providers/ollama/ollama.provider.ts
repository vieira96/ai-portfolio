import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { LlmProvider, LlmProviderError } from '../llm.provider.js';

interface OllamaGenerateResponse {
  response?: unknown;
}

interface OllamaGenerateChunk {
  response?: unknown;
  done?: unknown;
}

@Injectable()
export class OllamaLlmProvider extends LlmProvider {
  private readonly baseUrl: string;
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
    this.logger.setContext(OllamaLlmProvider.name);
    this.baseUrl = configService
      .getOrThrow<string>('OLLAMA_URL')
      .replace(/\/+$/, '');
    this.model = configService.getOrThrow<string>('OLLAMA_CHAT_MODEL');
    this.timeoutMs = Number(
      configService.getOrThrow<string>('OLLAMA_TIMEOUT_MS'),
    );
  }

  async chat(prompt: string): Promise<string> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw this.toProviderError(error);
    }

    if (response.status === 404) {
      throw new LlmProviderError(
        'model_not_found',
        `Model ${this.model} not found`,
      );
    }

    if (response.status === 413) {
      throw new LlmProviderError(
        'payload_too_large',
        `Ollama request payload too large for model ${this.model}`,
      );
    }

    if (!response.ok) {
      throw new LlmProviderError(
        'bad_response',
        `Unexpected status ${response.status}`,
      );
    }

    let payload: OllamaGenerateResponse;
    try {
      payload = (await response.json()) as OllamaGenerateResponse;
    } catch {
      throw new LlmProviderError('bad_response', 'Invalid JSON response');
    }

    if (
      typeof payload.response !== 'string' ||
      payload.response.trim() === ''
    ) {
      throw new LlmProviderError('bad_response', 'Empty text response');
    }

    return payload.response;
  }

  async *chatStream(prompt: string): AsyncGenerator<string, void, void> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: true,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw this.toProviderError(error);
    }

    if (response.status === 404) {
      throw new LlmProviderError(
        'model_not_found',
        `Model ${this.model} not found`,
      );
    }

    if (!response.ok || !response.body) {
      throw new LlmProviderError(
        'bad_response',
        `Unexpected status ${response.status}`,
      );
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
          const parsed = this.parseLine(line);
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
        const parsed = this.parseLine(buffer);
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

  private parseLine(line: string): { delta: string | null; finished: boolean } {
    const text = line.trim();
    if (text === '') {
      return { delta: null, finished: false };
    }
    let parsed: OllamaGenerateChunk;
    try {
      parsed = JSON.parse(text) as OllamaGenerateChunk;
    } catch {
      throw new LlmProviderError('bad_response', 'Invalid stream chunk');
    }
    const finished = parsed.done === true;
    const delta =
      typeof parsed.response === 'string' && parsed.response !== ''
        ? parsed.response
        : null;
    if (delta === null && !finished) {
      throw new LlmProviderError('bad_response', 'Invalid stream chunk');
    }
    return { delta, finished };
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

  private toProviderError(error: unknown): LlmProviderError {
    if (error instanceof Error && error.name === 'AbortError') {
      return new LlmProviderError('timeout', 'Request timed out');
    }
    return new LlmProviderError(
      'unreachable',
      error instanceof Error ? error.message : 'Request failed',
    );
  }
}
