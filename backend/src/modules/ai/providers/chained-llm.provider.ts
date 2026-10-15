import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { GroqLlmProvider } from './groq/groq.provider.js';
import { GeminiLlmProvider } from './gemini/gemini.provider.js';
import {
  LlmProvider,
  LlmProviderError,
  isGeminiConfigured,
  isGroqConfigured,
} from './llm.provider.js';
import { OllamaLlmProvider } from './ollama/ollama.provider.js';

// Decisão única de provedor: cadeia condicional, Ollama sempre por último.
// Providers configurados entram em Groq → Gemini → Ollama. Só o rate limit
// avança para o próximo provider; demais erros passam direto.
@Injectable()
export class ChainedLlmProvider extends LlmProvider {
  private readonly chain: LlmProvider[];

  get modelName(): string {
    return this.chain[0].modelName;
  }

  constructor(
    groq: GroqLlmProvider,
    gemini: GeminiLlmProvider,
    ollama: OllamaLlmProvider,
    configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    super();
    this.logger.setContext(ChainedLlmProvider.name);
    const providers: LlmProvider[] = [];
    if (isGroqConfigured(configService)) {
      providers.push(groq);
    }
    if (isGeminiConfigured(configService)) {
      providers.push(gemini);
    }
    providers.push(ollama);
    this.chain = providers;
  }

  private shouldRetry(error: unknown): boolean {
    return (
      error instanceof LlmProviderError &&
      (error.reason === 'rate_limited' || error.reason === 'payload_too_large')
    );
  }

  private logRetry(
    from: LlmProvider,
    to: LlmProvider,
    reason: LlmProviderError['reason'],
  ): void {
    const message =
      reason === 'rate_limited'
        ? 'LLM rate limited, trying next'
        : 'LLM request too large, trying next';
    this.logger.warn(
      {
        reason,
        model: from.modelName,
        fallback: to.modelName,
      },
      message,
    );
  }

  async chat(prompt: string): Promise<string> {
    for (const [index, provider] of this.chain.entries()) {
      const last = index === this.chain.length - 1;
      try {
        return await provider.chat(prompt);
      } catch (error) {
        if (last || !this.shouldRetry(error)) {
          throw error;
        }
        this.logRetry(provider, this.chain[index + 1], (error as LlmProviderError).reason);
      }
    }
    throw new LlmProviderError('unreachable', 'No LLM provider available');
  }

  async *chatStream(prompt: string): AsyncGenerator<string, void, void> {
    // 429 é sinal de request-time: a troca acontece antes do primeiro token.
    for (const [index, provider] of this.chain.entries()) {
      const last = index === this.chain.length - 1;
      try {
        yield* provider.chatStream(prompt);
        return;
      } catch (error) {
        if (last || !this.shouldRetry(error)) {
          throw error;
        }
        this.logRetry(provider, this.chain[index + 1], (error as LlmProviderError).reason);
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.chain[0].isAvailable();
  }
}
