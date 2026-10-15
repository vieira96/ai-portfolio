import type { ConfigService } from '@nestjs/config';

export type LlmUnavailableReason =
  | 'unreachable'
  | 'model_not_found'
  | 'timeout'
  | 'rate_limited'
  | 'payload_too_large'
  | 'bad_response';

export class LlmProviderError extends Error {
  readonly reason: LlmUnavailableReason;

  constructor(reason: LlmUnavailableReason, message: string) {
    super(message);
    this.name = 'LlmProviderError';
    this.reason = reason;
  }
}

export abstract class LlmProvider {
  abstract readonly modelName: string;
  abstract chat(prompt: string): Promise<string>;
  abstract chatStream(prompt: string): AsyncGenerator<string, void, void>;
  abstract isAvailable(): Promise<boolean>;
}

// Groq ativo quando há key configurada (string não vazia); senão, Ollama.
// Seleção determinística no boot, sem troca em runtime (fallback de limite é
// responsabilidade da composição, não da seleção).
export function isGroqConfigured(configService: ConfigService): boolean {
  const key = configService.get<string>('GROQ_API_KEY');
  return typeof key === 'string' && key.length > 0;
}

export function isGeminiConfigured(configService: ConfigService): boolean {
  const key = configService.get<string>('GEMINI_API_KEY');
  return typeof key === 'string' && key.length > 0;
}
