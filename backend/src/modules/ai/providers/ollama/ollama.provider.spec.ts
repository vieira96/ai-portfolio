import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LlmProviderError } from '../llm.provider.js';
import { OllamaLlmProvider } from './ollama.provider.js';

describe('OllamaLlmProvider', () => {
  const config = {
    OLLAMA_URL: 'http://localhost:11434',
    OLLAMA_CHAT_MODEL: 'qwen2.5:7b',
    OLLAMA_TIMEOUT_MS: '60000',
  };
  const fetchMock = vi.fn();
  const logger = {
    setContext: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };

  let provider: OllamaLlmProvider;

  function jsonResponse(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), { status });
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaLlmProvider,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => config[key as keyof typeof config],
          },
        },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    provider = module.get<OllamaLlmProvider>(OllamaLlmProvider);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts to /api/generate with model, prompt and stream disabled', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { response: 'qwen ok' }));

    const text = await provider.chat('ping');

    expect(text).toBe('qwen ok');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:11434/api/generate');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      model: 'qwen2.5:7b',
      prompt: 'ping',
      stream: false,
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('maps a refused connection to unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const error = await provider.chat('ping').catch((error: unknown) => error);

    expect(error).toBeInstanceOf(LlmProviderError);
    expect((error as LlmProviderError).reason).toBe('unreachable');
  });

  it('maps a missing model to model_not_found', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(404, { error: "model 'qwen2.5:7b' not found" }),
    );

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

  it('maps invalid JSON to bad_response', async () => {
    fetchMock.mockResolvedValue(new Response('not-json{{{', { status: 200 }));

    const error = await provider.chat('ping').catch((error: unknown) => error);

    expect(error).toBeInstanceOf(LlmProviderError);
    expect((error as LlmProviderError).reason).toBe('bad_response');
  });

  it('maps empty text to bad_response', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { response: '   ' }));

    const error = await provider.chat('ping').catch((error: unknown) => error);

    expect(error).toBeInstanceOf(LlmProviderError);
    expect((error as LlmProviderError).reason).toBe('bad_response');
  });

  it('reports available when generation succeeds', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { response: 'qwen ok' }));

    await expect(provider.isAvailable()).resolves.toBe(true);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('reports unavailable and logs reason without secrets', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(provider.isAvailable()).resolves.toBe(false);
    expect(logger.warn).toHaveBeenCalledWith({
      reason: 'unreachable',
      model: 'qwen2.5:7b',
    });
  });

  describe('chatStream', () => {
    const encoder = new TextEncoder();

    function chunkedResponse(lines: Array<string | Error>): Response {
      const stream = new ReadableStream<Uint8Array>({
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
      });
      return new Response(stream, { status: 200 });
    }

    async function collect(
      generator: AsyncGenerator<string>,
    ): Promise<string[]> {
      const deltas: string[] = [];
      for await (const delta of generator) {
        deltas.push(delta);
      }
      return deltas;
    }

    it('sends stream:true and yields deltas in order until done', async () => {
      fetchMock.mockResolvedValue(
        chunkedResponse([
          '{"response":"qwen"}\n',
          '{"response":" ok","done":true}\n',
        ]),
      );

      const deltas = await collect(provider.chatStream('ping'));

      expect(deltas).toEqual(['qwen', ' ok']);
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(init.body as string)).toMatchObject({ stream: true });
    });

    it('maps a missing model to model_not_found', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(404, { error: "model 'qwen2.5:7b' not found" }),
      );

      const error = await collect(provider.chatStream('ping')).catch(
        (error: unknown) => error,
      );

      expect(error).toBeInstanceOf(LlmProviderError);
      expect((error as LlmProviderError).reason).toBe('model_not_found');
    });

    it('maps invalid chunk JSON to bad_response', async () => {
      fetchMock.mockResolvedValue(chunkedResponse(['not-json{{{']));

      const error = await collect(provider.chatStream('ping')).catch(
        (error: unknown) => error,
      );

      expect(error).toBeInstanceOf(LlmProviderError);
      expect((error as LlmProviderError).reason).toBe('bad_response');
    });

    it('maps a mid-stream abort to timeout', async () => {
      fetchMock.mockResolvedValue(
        chunkedResponse([
          '{"response":"qw"}\n',
          Object.assign(new Error('aborted'), { name: 'AbortError' }),
        ]),
      );

      const error = await collect(provider.chatStream('ping')).catch(
        (error: unknown) => error,
      );

      expect(error).toBeInstanceOf(LlmProviderError);
      expect((error as LlmProviderError).reason).toBe('timeout');
    });

    it('resolves empty when done arrives without text', async () => {
      fetchMock.mockResolvedValue(
        chunkedResponse(['{"done":true}\n']),
      );

      await expect(collect(provider.chatStream('ping'))).resolves.toEqual([]);
    });
  });
});
