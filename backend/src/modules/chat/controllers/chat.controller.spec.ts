import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import {
  ChatQueueUnavailableError,
  ChatService,
  INVALID_SUBJECT_TEXT,
} from '../services/chat.service.js';
import { ChatController } from './chat.controller.js';

describe('ChatController', () => {
  const validVisitorId = '123e4567-e89b-42d3-a456-426614174000';
  const ask = vi.fn();
  const listMessages = vi.fn();

  async function createController(): Promise<ChatController> {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: { ask, listMessages } },
      ],
    }).compile();

    return module.get<ChatController>(ChatController);
  }

  function passthroughRes(): { res: Response; status: ReturnType<typeof vi.fn> } {
    const status = vi.fn();
    return { res: { status } as unknown as Response, status };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('answers 200 as the AI without queueing when the question is invalid', async () => {
    ask.mockResolvedValue({ kind: 'invalid', answer: INVALID_SUBJECT_TEXT });
    const controller = await createController();
    const { res, status } = passthroughRes();

    const result = await controller.send(
      validVisitorId,
      { message: '   ' },
      res,
    );

    expect(ask).toHaveBeenCalledWith(validVisitorId, '   ');
    expect(status).toHaveBeenCalledWith(200);
    expect(result).toEqual({ answer: INVALID_SUBJECT_TEXT });
  });

  it('creates pending and answers 201 when the question is valid', async () => {
    const createdAt = new Date('2026-10-07T12:00:00.000Z');
    ask.mockResolvedValue({ kind: 'queued', messageId: 'msg-1', createdAt });
    const controller = await createController();
    const { res, status } = passthroughRes();

    const result = await controller.send(
      validVisitorId,
      { message: 'onde atuou?' },
      res,
    );

    expect(ask).toHaveBeenCalledWith(validVisitorId, 'onde atuou?');
    expect(status).toHaveBeenCalledWith(201);
    expect(result).toEqual({ id: 'msg-1', status: 'pending', createdAt });
  });

  it('answers 503 with QUEUE_UNAVAILABLE when the queue is down', async () => {
    ask.mockRejectedValue(new ChatQueueUnavailableError());
    const controller = await createController();
    const { res, status } = passthroughRes();

    const result = await controller.send(
      validVisitorId,
      { message: 'onde atuou?' },
      res,
    );

    expect(status).toHaveBeenCalledWith(503);
    expect(result).toEqual({
      code: 'QUEUE_UNAVAILABLE',
      message: expect.any(String),
    });
  });

  it('rethrows unexpected errors', async () => {
    ask.mockRejectedValue(new Error('boom'));
    const controller = await createController();
    const { res } = passthroughRes();

    await expect(
      controller.send(validVisitorId, { message: 'oi' }, res),
    ).rejects.toThrow('boom');
  });

  describe('list', () => {
    const page = {
      data: [
        {
          id: 'msg-1',
          question: 'onde atuou?',
          answer: null,
          status: 'pending',
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    };

    it('returns the owner history delegating pagination', async () => {
      listMessages.mockResolvedValue(page);
      const controller = await createController();

      const result = await controller.list(
        validVisitorId,
        { page: 2, size: 10 },
      );

      expect(listMessages).toHaveBeenCalledWith(validVisitorId, {
        page: 2,
        size: 10,
      });
      expect(result).toBe(page);
    });
  });
});
