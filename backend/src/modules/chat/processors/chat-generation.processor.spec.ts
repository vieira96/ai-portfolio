import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { describe, expect, it, vi } from 'vitest';
import { LlmProvider, LlmProviderError } from '../../ai/providers/llm.provider.js';
import { ChatGateway } from '../gateways/chat.gateway.js';
import { ChatMessageRepository } from '../repositories/chat-message.repository.js';
import { ChatService } from '../services/chat.service.js';
import {
  ChatGenerationProcessor,
  buildChatPrompt,
} from './chat-generation.processor.js';

describe('ChatGenerationProcessor', () => {
  const chatMessages = {
    findById: vi.fn(),
    markDone: vi.fn(),
    markFailed: vi.fn(),
  };
  const chatService = {
    buildContext: vi.fn(),
  };
  const llm = {
    chat: vi.fn(),
    chatStream: vi.fn(),
    isAvailable: vi.fn(),
  };
  const gateway = {
    emitToVisitor: vi.fn(),
  };
  const logger = {
    setContext: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };

  async function createProcessor(): Promise<ChatGenerationProcessor> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGenerationProcessor,
        { provide: ChatMessageRepository, useValue: chatMessages },
        { provide: ChatService, useValue: chatService },
        { provide: LlmProvider, useValue: llm },
        { provide: ChatGateway, useValue: gateway },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    return module.get<ChatGenerationProcessor>(ChatGenerationProcessor);
  }

  function textStream(deltas: string[]): AsyncGenerator<string> {
    async function* generate(): AsyncGenerator<string> {
      for (const delta of deltas) {
        yield delta;
      }
    }
    return generate();
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('streams tokens, marks done and emits conclusion', async () => {
    chatMessages.findById.mockResolvedValue({
      id: 'msg-1',
      visitorId: 'visitor-1',
      question: 'onde atuou?',
      status: 'pending',
    });
    chatService.buildContext.mockResolvedValue('CTX');
    llm.chatStream.mockReturnValue(textStream(['Olá', ' mundo']));
    const processor = await createProcessor();

    await processor.process({ data: { messageId: 'msg-1' } } as never);

    expect(chatService.buildContext).toHaveBeenCalledOnce();
    expect(gateway.emitToVisitor).toHaveBeenNthCalledWith(1, 'visitor-1', 'chat:token', {
      delta: 'Olá',
    });
    expect(gateway.emitToVisitor).toHaveBeenNthCalledWith(2, 'visitor-1', 'chat:token', {
      delta: ' mundo',
    });
    expect(chatMessages.markDone).toHaveBeenCalledWith('msg-1', 'Olá mundo');
    expect(gateway.emitToVisitor).toHaveBeenNthCalledWith(3, 'visitor-1', 'chat:done', {
      answer: 'Olá mundo',
    });
  });

  it('marks failed and emits error on mid-stream failure without done', async () => {
    chatMessages.findById.mockResolvedValue({
      id: 'msg-1',
      visitorId: 'visitor-1',
      question: 'onde atuou?',
      status: 'pending',
    });
    chatService.buildContext.mockResolvedValue('CTX');
    llm.chatStream.mockReturnValue(textStream(['parcial']));
    llm.chatStream.mockImplementationOnce(async function* () {
      yield 'parcial';
      throw new LlmProviderError('timeout', 'timed out');
    });
    const processor = await createProcessor();

    await processor.process({ data: { messageId: 'msg-1' } } as never);

    expect(chatMessages.markFailed).toHaveBeenCalledWith('msg-1');
    expect(chatMessages.markDone).not.toHaveBeenCalled();
    expect(gateway.emitToVisitor).toHaveBeenCalledWith('visitor-1', 'chat:error', {
      code: 'TIMEOUT',
      message: expect.any(String),
    });
    const events = gateway.emitToVisitor.mock.calls.map(
      (call: unknown[]) => call[1],
    );
    expect(events).not.toContain('chat:done');
  });

  it('marks failed on empty generation', async () => {
    chatMessages.findById.mockResolvedValue({
      id: 'msg-1',
      visitorId: 'visitor-1',
      question: 'onde atuou?',
      status: 'pending',
    });
    chatService.buildContext.mockResolvedValue('CTX');
    llm.chatStream.mockReturnValue(textStream([]));
    const processor = await createProcessor();

    await processor.process({ data: { messageId: 'msg-1' } } as never);

    expect(chatMessages.markFailed).toHaveBeenCalledWith('msg-1');
    expect(gateway.emitToVisitor).toHaveBeenCalledWith('visitor-1', 'chat:error', {
      code: 'MODEL_UNAVAILABLE',
      message: expect.any(String),
    });
  });

  it('ignores missing and non-pending records', async () => {
    chatMessages.findById.mockResolvedValueOnce(null);
    const processor = await createProcessor();

    await processor.process({ data: { messageId: 'missing' } } as never);

    expect(chatService.buildContext).not.toHaveBeenCalled();

    chatMessages.findById.mockResolvedValueOnce({ status: 'done' });
    await processor.process({ data: { messageId: 'msg-1' } } as never);

    expect(chatService.buildContext).not.toHaveBeenCalled();
  });

  it('builds the prompt with context and question', () => {
    const prompt = buildChatPrompt('CTX', 'onde atuou?');

    expect(prompt).toContain('CTX');
    expect(prompt).toContain('onde atuou?');
    expect(prompt).toContain('pt-BR');
  });

  it('forbids inferring facts missing from the context', () => {
    const prompt = buildChatPrompt('CTX', 'onde atuou?');

    expect(prompt).toContain('não há registro');
    expect(prompt).toContain('nunca infira');
  });
});
