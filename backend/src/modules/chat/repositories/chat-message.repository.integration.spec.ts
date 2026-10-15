import { execSync } from 'node:child_process';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { PrismaService } from '../../../infra/database/prisma.service.js';
import { ChatMessageRepository } from './chat-message.repository.js';

describe('ChatMessageRepository (integration)', () => {
  let container: StartedTestContainer;
  let prismaService: PrismaService;
  let repository: ChatMessageRepository;

  const databaseUrl = (port: number): string =>
    `postgresql://test:test@localhost:${port}/test?schema=public`;

  async function prepareDatabase(url: string): Promise<void> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 10; attempt++) {
      const pool = new Pool({ connectionString: url });
      try {
        await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
        await pool.end();
        return;
      } catch (error) {
        lastError = error;
        await pool.end().catch(() => undefined);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    throw lastError;
  }

  beforeAll(async () => {
    const started = await new GenericContainer(
      'postgres:16',
    )
      .withEnvironment({
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
        POSTGRES_DB: 'test',
      })
      .withExposedPorts(5432)
      .withWaitStrategy(
        Wait.forLogMessage('database system is ready to accept connections'),
      )
      .start();
    container = started;

    try {
      const url = databaseUrl(started.getMappedPort(5432));
      await prepareDatabase(url);

      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: url },
        stdio: 'pipe',
      });

      const configService = {
        get: () => url,
        getOrThrow: () => url,
      } as unknown as ConfigService;
      prismaService = new PrismaService(configService);
      await prismaService.onModuleInit();
      repository = new ChatMessageRepository(prismaService);
    } catch (error) {
      await started.stop();
      throw error;
    }
  }, 180000);

  afterAll(async () => {
    await prismaService?.onModuleDestroy();
    await container?.stop();
  });

  it('creates a pending message and transitions it', async () => {
    const created = await repository.createPending('visitor-1', 'onde atuou?');

    expect(created.status).toBe('pending');
    expect(created.answer).toBeNull();

    const found = await repository.findById(created.id);
    expect(found?.question).toBe('onde atuou?');

    const done = await repository.markDone(created.id, 'Atuei na Levante.');
    expect(done.status).toBe('done');
    expect(done.answer).toBe('Atuei na Levante.');

    const failed = await repository.markFailed(created.id);
    expect(failed.status).toBe('failed');

    await prismaService.chatMessage.delete({ where: { id: created.id } });
  });

  it('lists only the owner messages in order with pagination', async () => {
    const first = new Date('2026-10-01T12:00:00.000Z');
    const second = new Date('2026-10-01T12:01:00.000Z');
    const third = new Date('2026-10-01T12:02:00.000Z');
    const created = await prismaService.chatMessage.createMany({
      data: [
        { visitorId: 'visitor-a', question: 'q1', createdAt: first },
        { visitorId: 'visitor-a', question: 'q2', createdAt: second },
        { visitorId: 'visitor-a', question: 'q3', createdAt: third },
        { visitorId: 'visitor-b', question: 'other', createdAt: second },
      ],
    });
    expect(created.count).toBe(4);

    try {
      const pageOne = await repository.listByVisitor('visitor-a', 1, 2);

      expect(pageOne.total).toBe(3);
      expect(pageOne.items.map((item) => item.question)).toEqual(['q1', 'q2']);

      const pageTwo = await repository.listByVisitor('visitor-a', 2, 2);

      expect(pageTwo.total).toBe(3);
      expect(pageTwo.items.map((item) => item.question)).toEqual(['q3']);

      const other = await repository.listByVisitor('visitor-b', 1, 20);

      expect(other.total).toBe(1);
      expect(other.items[0]?.question).toBe('other');
    } finally {
      await prismaService.chatMessage.deleteMany({
        where: { visitorId: { in: ['visitor-a', 'visitor-b'] } },
      });
    }
  });
});
