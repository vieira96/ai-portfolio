import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { LlmProvider, LlmProviderError } from '../llm.provider.js';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

interface GroqChatMessage {
  role: string;
  content?: unknown;
}

interface GroqChatChoice {
  message?: GroqChatMessage;
  delta?: GroqChatMessage;
}

interface GroqChatPayload {
  choices?: unknown;
}

@Injectable()
export class GroqLlmProvider extends LlmProvider {
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
    this.logger.setContext(GroqLlmProvider.name);
    const key = configService.get<string>('GROQ_API_KEY');
    this.apiKey = typeof key === 'string' && key.length > 0 ? key : undefined;
    this.model = configService.getOrThrow<string>('GROQ_MODEL');
    this.timeoutMs = Number(configService.getOrThrow<string>('GROQ_TIMEOUT_MS'));
  }

  private assertConfigured(): string {
    if (!this.apiKey) {
      throw new LlmProviderError(
        'unreachable',
        'Groq API key is not configured',
      );
    }
    return this.apiKey;
  }

  async chat(prompt: string): Promise<string> {
    const apiKey = this.assertConfigured();
    let response: Response;
    try {
      response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw this.toProviderError(error);
    }
    const payload = await this.readJson(response);

    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim() === '') {
      throw new LlmProviderError('bad_response', 'Empty text response');
    }
    return content;
  }

  async *chatStream(prompt: string): AsyncGenerator<string, void, void> {
    const apiKey = this.assertConfigured();
    let response: Response;
    try {
      response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
        }),
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
    if (text === '' || !text.startsWith('data:')) {
      return { delta: null, finished: false };
    }
    const data = text.slice('data:'.length).trim();
    if (data === '[DONE]') {
      return { delta: null, finished: true };
    }
    let parsed: GroqChatPayload;
    try {
      parsed = JSON.parse(data) as GroqChatPayload;
    } catch {
      throw new LlmProviderError('bad_response', 'Invalid stream chunk');
    }
    const choices = Array.isArray(parsed.choices) ? parsed.choices : [];
    const delta = choices[0]?.delta?.content;
    // Chunk de abertura (só `role`, sem `content`) não é erro: ignora e segue.
    if (typeof delta !== 'string' || delta === '') {
      return { delta: null, finished: false };
    }
    return { delta, finished: false };
  }

  private async readJson(response: Response): Promise<{
    choices?: GroqChatChoice[];
  }> {
    this.throwForStatus(response);
    try {
      return (await response.json()) as { choices?: GroqChatChoice[] };
    } catch {
      throw new LlmProviderError('bad_response', 'Invalid JSON response');
    }
  }

  private throwForStatus(response: Response): void {
    if (response.ok) {
      return;
    }
    if (response.status === 404) {
      throw new LlmProviderError(
        'model_not_found',
        `Model ${this.model} not found`,
      );
    }
    if (response.status === 429) {
      throw new LlmProviderError(
        'rate_limited',
        `Groq rate limit exceeded for model ${this.model}`,
      );
    }
    if (response.status === 413) {
      throw new LlmProviderError(
        'payload_too_large',
        `Groq request payload too large for model ${this.model}`,
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new LlmProviderError(
        'unreachable',
        `Groq request rejected with status ${response.status}`,
      );
    }
    throw new LlmProviderError(
      'bad_response',
      `Unexpected status ${response.status}`,
    );
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
