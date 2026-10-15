import { INestApplication } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AddressInfo } from 'node:net';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { PrismaService } from '../../infra/database/prisma.service.js';
import {
  TestAppContext,
  setupTestApp,
  teardownTestApp,
} from '../../../test/helpers/e2e-setup.helper.js';

describe('Chat setup (e2e)', () => {
  let app: INestApplication;
  let context: TestAppContext;
  let redis: StartedTestContainer;
  let port: number;
  const fetchMock = vi.fn();

  const originalRedisUrl = process.env.REDIS_URL;

  beforeAll(async () => {
    redis = await new GenericContainer(
      'public.ecr.aws/docker/library/redis:7-alpine',
    )
      .withExposedPorts(6379)
      .start();
    process.env.REDIS_URL = `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`;

    context = await setupTestApp({
      name: 'E2E Chat',
      email: 'e2e-chat@example.com',
      password: 'e2e-pass-123',
    });
    app = context.app;

    vi.stubGlobal('fetch', fetchMock);

    const server = app.getHttpServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    port = (server.address() as AddressInfo).port;
  }, 180000);

  afterAll(async () => {
    await teardownTestApp(context);
    await redis.stop();
    vi.unstubAllGlobals();
    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = originalRedisUrl;
    }
  });

  it('boots with the queue connected to Redis (AC-02)', async () => {
    const queue = app.get<Queue>(getQueueToken('chat-generation'));

    await queue.waitUntilReady();

    expect(queue.name).toBe('chat-generation');
  });

  it('accepts a socket.io-client connection on the base gateway (AC-03)', async () => {
    const socket = io(`http://127.0.0.1:${port}`, { timeout: 15000 });

    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => resolve());
      socket.on('connect_error', (error: unknown) => reject(error));
    });

    expect(socket.connected).toBe(true);
    socket.disconnect();
  });

  it('persists chat_message through the migration (AC-04)', async () => {
    const prisma = app.get(PrismaService);

    const created = await prisma.chatMessage.create({
      data: { visitorId: 'e2e-visitor', question: 'ping?' },
    });
    expect(created.status).toBe('pending');

    const found = await prisma.chatMessage.findUnique({
      where: { id: created.id },
    });
    expect(found?.question).toBe('ping?');

    await prisma.chatMessage.delete({ where: { id: created.id } });
  });

  describe('chat cycle over REST', () => {
    const encoder = new TextEncoder();

    function chunkedLines(lines: Array<string | Error>): Response {
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

    async function connectVisitor(cookie?: string): Promise<Socket> {
      const socket = io(`http://127.0.0.1:${port}`, {
        timeout: 15000,
        extraHeaders: cookie ? { cookie: `chat_visitor=${cookie}` } : {},
      });
      await new Promise<void>((resolve, reject) => {
        socket.on('connect', () => resolve());
        socket.on('connect_error', (error: unknown) => reject(error));
      });
      return socket;
    }

    function collect(socket: Socket) {
      const events: Array<{ event: string; payload: unknown }> = [];
      for (const event of ['chat:token', 'chat:done', 'chat:error']) {
        socket.on(event, (payload: unknown) => events.push({ event, payload }));
      }
      return events;
    }

    async function waitFor(
      events: Array<{ event: string; payload: unknown }>,
      event: string,
      timeoutMs = 30000,
    ): Promise<unknown> {
      const start = Date.now();
      for (;;) {
        const found = events.find((entry) => entry.event === event);
        if (found) {
          return found.payload;
        }
        if (Date.now() - start > timeoutMs) {
          throw new Error(`timed out waiting for ${event}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    async function waitForMessageStatus(
      messageId: string,
      status: 'pending' | 'done' | 'failed',
      timeoutMs = 5000,
    ): Promise<void> {
      const start = Date.now();
      for (;;) {
        const message = await app
          .get(PrismaService)
          .chatMessage.findUnique({ where: { id: messageId } });
        if (message?.status === status) {
          return;
        }
        if (Date.now() - start > timeoutMs) {
          throw new Error(
            `timed out waiting for message ${messageId} to become ${status}`,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    beforeEach(() => {
      fetchMock.mockReset();
    });

    afterEach(async () => {
      await app.get(PrismaService).chatMessage.deleteMany({
        where: { visitorId: { startsWith: 'e2e-' } },
      });
      await app.get(PrismaService).chatMessage.deleteMany({
        where: { question: { startsWith: 'e2e ' } },
      });
    });

    it('creates pending with a fresh cookie on first contact (AC-08, AC-01)', async () => {
      const queue = app.get<Queue>(getQueueToken('chat-generation'));
      await queue.pause();
      try {
        const response = await request(app.getHttpServer())
          .post('/chat/messages')
          .send({ message: 'e2e rest q1?' })
          .expect(201);

        expect(response.body.status).toBe('pending');
        expect(typeof response.body.id).toBe('string');
        const setCookie = String(response.headers['set-cookie'] ?? '');
        const visitorId = /chat_visitor=([^;]+)/.exec(setCookie)?.[1];
        expect(visitorId).toMatch(/^[0-9a-f-]{36}$/i);

        const row = await app.get(PrismaService).chatMessage.findUnique({
          where: { id: response.body.id },
        });
        expect(row?.visitorId).toBe(visitorId);
        expect(row?.status).toBe('pending');

        const queuedJob = (await queue.getJobs(['waiting'])).find(
          (job) => job.data.messageId === response.body.id,
        );
        expect(queuedJob).toBeDefined();
        if (!queuedJob) {
          throw new Error('Expected chat job to be queued');
        }
        await queuedJob.remove();
      } finally {
        await queue.resume();
      }
    });

    it('streams tokens on the socket and concludes, then history shows it (AC-03, AC-08)', async () => {
      fetchMock.mockResolvedValue(
        chunkedLines([
          '{"response":"Olá "}\n',
          '{"response":"mundo","done":true}\n',
        ]),
      );
      const visitorId = '223e4567-e89b-42d3-a456-426614174000';
      const socket = await connectVisitor(visitorId);
      const events = collect(socket);
      try {
        await request(app.getHttpServer())
          .post('/chat/messages')
          .set('Cookie', `chat_visitor=${visitorId}`)
          .send({ message: 'e2e rest q2?' })
          .expect(201);

        const done = (await waitFor(events, 'chat:done')) as { answer: string };
        expect(done.answer).toBe('Olá mundo');
        expect(
          events.filter((entry) => entry.event === 'chat:token'),
        ).toHaveLength(2);

        const history = await request(app.getHttpServer())
          .get('/chat/messages?size=20')
          .set('Cookie', `chat_visitor=${visitorId}`)
          .expect(200);
        const item = (
          history.body.data as Array<{
            question: string;
            answer: string;
            status: string;
          }>
        ).find((entry) => entry.question === 'e2e rest q2?');
        expect(item).toMatchObject({ answer: 'Olá mundo', status: 'done' });
      } finally {
        socket.disconnect();
      }
    });

    it('errors TIMEOUT without done on mid-stream cut (worker intact)', async () => {
      fetchMock.mockResolvedValue(
        chunkedLines([
          '{"response":"par"}\n',
          Object.assign(new Error('aborted'), { name: 'AbortError' }),
        ]),
      );
      const visitorId = '323e4567-e89b-42d3-a456-426614174000';
      const socket = await connectVisitor(visitorId);
      const events = collect(socket);
      try {
        await request(app.getHttpServer())
          .post('/chat/messages')
          .set('Cookie', `chat_visitor=${visitorId}`)
          .send({ message: 'e2e rest q3?' })
          .expect(201);

        const error = (await waitFor(events, 'chat:error')) as { code: string };
        expect(error.code).toBe('TIMEOUT');
        expect(events.some((entry) => entry.event === 'chat:done')).toBe(false);

        const row = await app.get(PrismaService).chatMessage.findFirst({
          where: { question: 'e2e rest q3?' },
        });
        expect(row?.status).toBe('failed');
      } finally {
        socket.disconnect();
      }
    });

    it('answers invalid as 200 without queueing or model (AC-09)', async () => {
      const visitorId = '423e4567-e89b-42d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .post('/chat/messages')
        .set('Cookie', `chat_visitor=${visitorId}`)
        .send({ message: '   ' })
        .expect(200);

      expect(String(response.body.answer)).toContain('Desculpe');
      expect(fetchMock).not.toHaveBeenCalled();
      const row = await app.get(PrismaService).chatMessage.findFirst({
        where: { visitorId },
      });
      expect(row).toBeNull();
    });

    it('rejects a missing message as 400', async () => {
      await request(app.getHttpServer())
        .post('/chat/messages')
        .send({})
        .expect(400);
    });

    it('emits MODEL_UNAVAILABLE when the model is down', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));
      const visitorId = '523e4567-e89b-42d3-a456-426614174000';
      const socket = await connectVisitor(visitorId);
      const events = collect(socket);
      try {
        await request(app.getHttpServer())
          .post('/chat/messages')
          .set('Cookie', `chat_visitor=${visitorId}`)
          .send({ message: 'e2e rest q4?' })
          .expect(201);

        const error = (await waitFor(events, 'chat:error')) as { code: string };
        expect(error.code).toBe('MODEL_UNAVAILABLE');

        const row = await app.get(PrismaService).chatMessage.findFirst({
          where: { question: 'e2e rest q4?' },
        });
        expect(row?.status).toBe('failed');
      } finally {
        socket.disconnect();
      }
    });

    it('isolates push and history per visitor (AC-02)', async () => {
      fetchMock.mockResolvedValue(
        chunkedLines(['{"response":"oi","done":true}\n']),
      );
      const visitorA = '623e4567-e89b-42d3-a456-426614174000';
      const visitorB = '723e4567-e89b-42d3-a456-426614174000';
      const socketB = await connectVisitor(visitorB);
      const eventsB = collect(socketB);
      try {
        const response = await request(app.getHttpServer())
          .post('/chat/messages')
          .set('Cookie', `chat_visitor=${visitorA}`)
          .send({ message: 'e2e rest q5?' })
          .expect(201);

        await waitForMessageStatus(response.body.id as string, 'done');
        expect(eventsB).toEqual([]);

        const historyB = await request(app.getHttpServer())
          .get('/chat/messages?size=20')
          .set('Cookie', `chat_visitor=${visitorB}`)
          .expect(200);
        expect(historyB.body.total).toBe(0);

        const historyA = await request(app.getHttpServer())
          .get('/chat/messages?size=20')
          .set('Cookie', `chat_visitor=${visitorA}`)
          .expect(200);
        expect(historyA.body.total).toBe(1);
      } finally {
        socketB.disconnect();
      }
    });

    it('paginates history in conversation order (AC-05)', async () => {
      const visitorId = '823e4567-e89b-42d3-a456-426614174000';
      await app.get(PrismaService).chatMessage.createMany({
        data: [1, 2, 3, 4, 5].map((n) => ({
          visitorId,
          question: `e2e page q${n}?`,
          createdAt: new Date(`2026-10-01T12:0${n}:00.000Z`),
        })),
      });

      const pageOne = await request(app.getHttpServer())
        .get('/chat/messages?page=1&size=2')
        .set('Cookie', `chat_visitor=${visitorId}`)
        .expect(200);
      expect(pageOne.body.total).toBe(5);
      expect(pageOne.body.totalPages).toBe(3);
      expect(
        (pageOne.body.data as Array<{ question: string }>).map(
          (entry) => entry.question,
        ),
      ).toEqual(['e2e page q1?', 'e2e page q2?']);

      const pageThree = await request(app.getHttpServer())
        .get('/chat/messages?page=3&size=2')
        .set('Cookie', `chat_visitor=${visitorId}`)
        .expect(200);
      expect(
        (pageThree.body.data as Array<{ question: string }>).map(
          (entry) => entry.question,
        ),
      ).toEqual(['e2e page q5?']);

      await request(app.getHttpServer())
        .get('/chat/messages?size=999')
        .set('Cookie', `chat_visitor=${visitorId}`)
        .expect(400);
    });

    it('returns empty history with a fresh cookie when cookieless (AC-01)', async () => {
      const response = await request(app.getHttpServer())
        .get('/chat/messages')
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.total).toBe(0);
      expect(String(response.headers['set-cookie'] ?? '')).toContain(
        'chat_visitor=',
      );
    });

    it('regenerates on malformed cookie (AC-04)', async () => {
      const response = await request(app.getHttpServer())
        .get('/chat/messages')
        .set('Cookie', 'chat_visitor=lixo')
        .expect(200);

      expect(response.body.data).toEqual([]);
      const setCookie = String(response.headers['set-cookie'] ?? '');
      expect(setCookie).toContain('chat_visitor=');
      expect(setCookie).not.toContain('lixo');
    });
  });
});
