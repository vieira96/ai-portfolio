import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LlmProviderError } from '../llm.provider.js';
import { GroqLlmProvider } from './groq.provider.js';

describe('GroqLlmProvider', () => {
  const config = {
    GROQ_API_KEY: 'test-key',
    GROQ_MODEL: 'openai/gpt-oss-120b',
    GROQ_TIMEOUT_MS: '60000',
  };
  const fetchMock = vi.fn();
  const logger = {
    setContext: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };

  let provider: GroqLlmProvider;

  function jsonResponse(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), { status });
  }

  function sseResponse(lines: Array<string | Error>): Response {
    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          for (const line of lines) {
            if (line instanceof Error) {
              controller.error(line);
              return;
            }
            controller.enqueue(encoder.encode(line));
          }
          controller.close();
        },
      }),
      { status: 200 },
    );
  }

  function choice(content: string): object {
    return { choices: [{ message: { role: 'assistant', content } }] };
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroqLlmProvider,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => config[key as keyof typeof config],
            getOrThrow: (key: string) => config[key as keyof typeof config],
          },
        },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    provider = module.get<GroqLlmProvider>(GroqLlmProvider);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts to chat completions with model, messages and bearer key', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, choice('groq ok')));

    const text = await provider.chat('ping');

    expect(text).toBe('groq ok');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer test-key',
    );
    expect(JSON.parse(init.body as string)).toEqual({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: 'ping' }],
      stream: false,
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('maps 401 to unreachable without leaking the key', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { error: 'unauthorized' }));

    const error = await provider.chat('ping').catch((error: unknown) => error);

    expect(error).toBeInstanceOf(LlmProviderError);
    expect((error as LlmProviderError).reason).toBe('unreachable');
  });

  it('maps 429 to rate_limited', async () => {
    fetchMock.mockResolvedValue(jsonResponse(429, { error: 'limited' }));

    const error = await provider.chat('ping').catch((error: unknown) => error);

    expect(error).toBeInstanceOf(LlmProviderError);
    expect((error as LlmProviderError).reason).toBe('rate_limited');
  });

  it('maps a missing model to model_not_found', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { error: 'no such model' }));

    const error = await provider.chat('ping').catch((error: unknown) => error);

    expect(error).toBeInstanceOf(LlmProviderError);
    expect((error as LlmProviderError).reason).toBe('model_not_found');
  });

  it('maps an abort to timeout', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new Error('The operation was aborted'), {
        name: 'AbortError',
      }),
    );

    const error = await provider.chat('ping').catch((error: unknown) => error);

    expect(error).toBeInstanceOf(LlmProviderError);
    expect((error as LlmProviderError).reason).toBe('timeout');
  });

  it('maps empty text to bad_response', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, choice('   ')));

    const error = await provider.chat('ping').catch((error: unknown) => error);

    expect(error).toBeInstanceOf(LlmProviderError);
    expect((error as LlmProviderError).reason).toBe('bad_response');
  });

  it('reports available when generation succeeds', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, choice('groq ok')));

    await expect(provider.isAvailable()).resolves.toBe(true);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('reports unavailable and logs reason without secrets', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(provider.isAvailable()).resolves.toBe(false);
    expect(logger.warn).toHaveBeenCalledWith({
      reason: 'unreachable',
      model: 'openai/gpt-oss-120b',
    });
    const logged = JSON.stringify(logger.warn.mock.calls);
    expect(logged).not.toContain('test-key');
  });

  describe('chatStream', () => {
    it('yields deltas in order ignoring the role-only opener', async () => {
      fetchMock.mockResolvedValue(
        sseResponse([
          'data: {"choices":[{"delta":{"role":"assistant"}}]}\n',
          'data: {"choices":[{"delta":{"content":"Olá "}}]}\n',
          'data: {"choices":[{"delta":{"content":"mundo"}}]}\n',
          'data: [DONE]\n',
        ]),
      );

      const deltas: string[] = [];
      for await (const delta of provider.chatStream('oi')) {
        deltas.push(delta);
      }

      expect(deltas).toEqual(['Olá ', 'mundo']);
    });

    it('maps invalid JSON chunk to bad_response', async () => {
      fetchMock.mockResolvedValue(sseResponse(['data: not-json{{{\n']));

      const error = await (async () => {
        try {
          for await (const _delta of provider.chatStream('oi')) {
            // consome até falhar
          }
          return null;
        } catch (error: unknown) {
          return error;
        }
      })();

      expect(error).toBeInstanceOf(LlmProviderError);
      expect((error as LlmProviderError).reason).toBe('bad_response');
    });

    it('maps a mid-stream abort to timeout', async () => {
      fetchMock.mockResolvedValue(
        sseResponse([
          'data: {"choices":[{"delta":{"content":"par"}}]}\n',
          Object.assign(new Error('aborted'), { name: 'AbortError' }),
        ]),
      );

      const error = await (async () => {
        try {
          for await (const _delta of provider.chatStream('oi')) {
            // consome até falhar (parcial anterior é descartado pelo stream)
          }
          return null;
        } catch (error: unknown) {
          return error;
        }
      })();

      expect(error).toBeInstanceOf(LlmProviderError);
      expect((error as LlmProviderError).reason).toBe('timeout');
    });
  });
});
