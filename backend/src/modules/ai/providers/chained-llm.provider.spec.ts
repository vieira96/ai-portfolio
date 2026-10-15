import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChainedLlmProvider } from './chained-llm.provider.js';
import { GeminiLlmProvider } from './gemini/gemini.provider.js';
import { GroqLlmProvider } from './groq/groq.provider.js';
import { LlmProviderError } from './llm.provider.js';
import { OllamaLlmProvider } from './ollama/ollama.provider.js';

describe('ChainedLlmProvider', () => {
  const groq = {
    modelName: 'openai/gpt-oss-120b',
    chat: vi.fn(),
    chatStream: vi.fn(),
    isAvailable: vi.fn(),
  };
  const gemini = {
    modelName: 'gemini-3.1-flash-lite',
    chat: vi.fn(),
    chatStream: vi.fn(),
    isAvailable: vi.fn(),
  };
  const ollama = {
    modelName: 'qwen2.5:7b',
    chat: vi.fn(),
    chatStream: vi.fn(),
    isAvailable: vi.fn(),
  };
  const logger = {
    setContext: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  function configWith(
    groqApiKey?: string,
    geminiApiKey?: string,
  ): ConfigService {
    return {
      get: (key: string) => {
        if (key === 'GROQ_API_KEY') return groqApiKey;
        if (key === 'GEMINI_API_KEY') return geminiApiKey;
        return undefined;
      },
    } as unknown as ConfigService;
  }

  function createProvider(
    groqApiKey?: string,
    geminiApiKey?: string,
  ): ChainedLlmProvider {
    return new ChainedLlmProvider(
      groq as unknown as GroqLlmProvider,
      gemini as unknown as GeminiLlmProvider,
      ollama as unknown as OllamaLlmProvider,
      configWith(groqApiKey, geminiApiKey),
      logger as unknown as PinoLogger,
    );
  }

  function rateLimited(provider: string): LlmProviderError {
    return new LlmProviderError('rate_limited', `${provider} limited`);
  }

  function payloadTooLarge(provider: string): LlmProviderError {
    return new LlmProviderError('payload_too_large', `${provider} payload too large`);
  }

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it.each([
    [undefined, undefined, ['qwen2.5:7b']],
    [undefined, 'gemini-key', ['gemini-3.1-flash-lite', 'qwen2.5:7b']],
    ['groq-key', undefined, ['openai/gpt-oss-120b', 'qwen2.5:7b']],
    [
      'groq-key',
      'gemini-key',
      ['openai/gpt-oss-120b', 'gemini-3.1-flash-lite', 'qwen2.5:7b'],
    ],
  ])('selects the configured provider chain', (groqKey, geminiKey, providers) => {
    const provider = createProvider(groqKey, geminiKey);

    expect(provider.modelName).toBe(providers[0]);
  });

  it('uses Gemini when Groq is not configured', async () => {
    gemini.chat.mockResolvedValue('gemini ok');

    const provider = createProvider(undefined, 'gemini-key');

    expect(provider.modelName).toBe('gemini-3.1-flash-lite');
    await expect(provider.chat('oi?')).resolves.toBe('gemini ok');
    expect(groq.chat).not.toHaveBeenCalled();
    expect(ollama.chat).not.toHaveBeenCalled();
  });

  it('uses Ollama when no remote provider is configured', async () => {
    ollama.chat.mockResolvedValue('ollama ok');

    await expect(createProvider().chat('oi?')).resolves.toBe('ollama ok');

    expect(groq.chat).not.toHaveBeenCalled();
    expect(gemini.chat).not.toHaveBeenCalled();
  });

  it('falls back from Groq to Gemini and preserves the prompt', async () => {
    groq.chat.mockRejectedValue(rateLimited('Groq'));
    gemini.chat.mockResolvedValue('gemini ok');

    await expect(
      createProvider('groq-key', 'gemini-key').chat('same prompt'),
    ).resolves.toBe('gemini ok');

    expect(gemini.chat).toHaveBeenCalledWith('same prompt');
    expect(ollama.chat).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      {
        reason: 'rate_limited',
        model: 'openai/gpt-oss-120b',
        fallback: 'gemini-3.1-flash-lite',
      },
      'LLM rate limited, trying next',
    );
  });

  it('falls back when the provider rejects an oversized request', async () => {
    groq.chat.mockRejectedValue(payloadTooLarge('Groq'));
    gemini.chat.mockResolvedValue('gemini ok');

    await expect(
      createProvider('groq-key', 'gemini-key').chat('large prompt'),
    ).resolves.toBe('gemini ok');

    expect(logger.warn).toHaveBeenCalledWith(
      {
        reason: 'payload_too_large',
        model: 'openai/gpt-oss-120b',
        fallback: 'gemini-3.1-flash-lite',
      },
      'LLM request too large, trying next',
    );
  });

  it('falls back from Gemini to Ollama when Gemini is limited', async () => {
    gemini.chat.mockRejectedValue(rateLimited('Gemini'));
    ollama.chat.mockResolvedValue('ollama ok');

    await expect(
      createProvider(undefined, 'gemini-key').chat('oi?'),
    ).resolves.toBe('ollama ok');

    expect(groq.chat).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      {
        reason: 'rate_limited',
        model: 'gemini-3.1-flash-lite',
        fallback: 'qwen2.5:7b',
      },
      'LLM rate limited, trying next',
    );
  });

  it('falls back from Groq directly to Ollama when Gemini is absent', async () => {
    groq.chat.mockRejectedValue(rateLimited('Groq'));
    ollama.chat.mockResolvedValue('ollama ok');

    await expect(createProvider('groq-key').chat('oi?')).resolves.toBe(
      'ollama ok',
    );

    expect(gemini.chat).not.toHaveBeenCalled();
  });

  it('does not fall back for non-rate-limit errors', async () => {
    const denied = new LlmProviderError('unreachable', 'denied');
    groq.chat.mockRejectedValue(denied);

    await expect(
      createProvider('groq-key', 'gemini-key').chat('oi?'),
    ).rejects.toBe(denied);
    expect(gemini.chat).not.toHaveBeenCalled();
    expect(ollama.chat).not.toHaveBeenCalled();
  });

  it('propagates the last error when every provider is exhausted', async () => {
    const ollamaDown = new LlmProviderError('unreachable', 'ollama down');
    groq.chat.mockRejectedValue(rateLimited('Groq'));
    gemini.chat.mockRejectedValue(rateLimited('Gemini'));
    ollama.chat.mockRejectedValue(ollamaDown);

    await expect(
      createProvider('groq-key', 'gemini-key').chat('oi?'),
    ).rejects.toBe(ollamaDown);
  });

  it('falls back sequentially in streaming mode', async () => {
    async function* rejected(): AsyncGenerator<string> {
      yield* [];
      throw rateLimited('Groq');
    }
    async function* fallback(): AsyncGenerator<string> {
      yield 'gemini';
    }
    groq.chatStream.mockImplementation(rejected);
    gemini.chatStream.mockImplementation(fallback);

    const seen: string[] = [];
    for await (const delta of createProvider('groq-key', 'gemini-key').chatStream('oi?')) {
      seen.push(delta);
    }

    expect(seen).toEqual(['gemini']);
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it('checks availability only on the first provider', async () => {
    groq.isAvailable.mockResolvedValue(true);

    await expect(
      createProvider('groq-key', 'gemini-key').isAvailable(),
    ).resolves.toBe(true);

    expect(gemini.isAvailable).not.toHaveBeenCalled();
    expect(ollama.isAvailable).not.toHaveBeenCalled();
  });
});
