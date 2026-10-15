import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LlmProviderError } from '../llm.provider.js';
import { GeminiLlmProvider } from './gemini.provider.js';

describe('GeminiLlmProvider', () => {
  const config = {
    GEMINI_API_KEY: 'test-key',
    GEMINI_MODEL: 'gemini-3.1-flash-lite',
    GEMINI_TIMEOUT_MS: '60000',
  };
  const fetchMock = vi.fn();
  const logger = {
    setContext: vi.fn(),
    warn: vi.fn(),
  };
  let provider: GeminiLlmProvider;

  function jsonResponse(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), { status });
  }

  function streamResponse(lines: Array<string | Error>): Response {
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

  function validResponse(text: string): object {
    return {
      candidates: [{ content: { parts: [{ text }] } }],
    };
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiLlmProvider,
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

    provider = module.get<GeminiLlmProvider>(GeminiLlmProvider);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the prompt to generateContent without exposing the key in the URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, validResponse('gemini ok')));

    await expect(provider.chat('ping')).resolves.toBe('gemini ok');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
    );
    expect(url).not.toContain('test-key');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe(
      'test-key',
    );
    expect(JSON.parse(init.body as string)).toEqual({
      contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
    });
  });

  it('concatenates text from multiple response parts', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        candidates: [{ content: { parts: [{ text: 'parte 1' }, { text: ' parte 2' }] } }],
      }),
    );

    await expect(provider.chat('ping')).resolves.toBe('parte 1 parte 2');
  });

  it.each([
    [429, 'rate_limited'],
    [401, 'unreachable'],
    [403, 'unreachable'],
    [404, 'model_not_found'],
    [500, 'bad_response'],
  ] as const)('maps HTTP %s to %s', async (status, reason) => {
    fetchMock.mockResolvedValue(jsonResponse(status, { error: 'provider error' }));

    const error = await provider.chat('ping').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(LlmProviderError);
    expect((error as LlmProviderError).reason).toBe(reason);
  });

  it('maps empty candidates to bad_response', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { candidates: [] }));

    const error = await provider.chat('ping').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(LlmProviderError);
    expect((error as LlmProviderError).reason).toBe('bad_response');
  });

  it('maps an abort to timeout', async () => {
    fetchMock.mockRejectedValue(
      Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }),
    );

    const error = await provider.chat('ping').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(LlmProviderError);
    expect((error as LlmProviderError).reason).toBe('timeout');
  });

  it('streams text events in order and ignores events without text', async () => {
    fetchMock.mockResolvedValue(
      streamResponse([
        'data: {"candidates":[{"content":{"parts":[{"text":"Olá "}]}}]}\n',
        'data: {"candidates":[{"finishReason":"STOP"}]}\n',
        'data: {"candidates":[{"content":{"parts":[{"text":"mundo"}]}}]}\n',
        'data: [DONE]\n',
      ]),
    );

    const deltas: string[] = [];
    for await (const delta of provider.chatStream('oi')) {
      deltas.push(delta);
    }

    expect(deltas).toEqual(['Olá ', 'mundo']);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(':streamGenerateContent?alt=sse');
    expect(JSON.parse(init.body as string)).toEqual({
      contents: [{ role: 'user', parts: [{ text: 'oi' }] }],
    });
  });

  it('maps an invalid stream event to bad_response', async () => {
    fetchMock.mockResolvedValue(streamResponse(['data: not-json{{{\n']));

    const error = await (async () => {
      try {
        for await (const _delta of provider.chatStream('oi')) {
          // Consome até o parser rejeitar o evento.
        }
        return null;
      } catch (caught: unknown) {
        return caught;
      }
    })();

    expect(error).toBeInstanceOf(LlmProviderError);
    expect((error as LlmProviderError).reason).toBe('bad_response');
  });

  it('reports availability when generation succeeds', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, validResponse('pong')));

    await expect(provider.isAvailable()).resolves.toBe(true);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('does not expose the API key in provider logs', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(provider.isAvailable()).resolves.toBe(false);

    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain('test-key');
  });
});
