import { execSync } from 'node:child_process';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { PrismaService } from '../../../infra/database/prisma.service.js';
import { TechnologyRepository } from './technology.repository.js';

describe('TechnologyRepository (integration)', () => {
  let container: StartedTestContainer;
  let prismaService: PrismaService;
  let repository: TechnologyRepository;

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
      repository = new TechnologyRepository(prismaService);
    } catch (error) {
      await started.stop();
      throw error;
    }
  });

  afterAll(async () => {
    await prismaService?.onModuleDestroy();
    await container?.stop();
  });

  it('creates and finds a technology with a database uuid', async () => {
    const created = await repository.create({
      name: 'NestJS',
      category: 'BACKEND',
    });

    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );

    const found = await repository.findById(created.id);

    expect(found).toMatchObject({ name: 'NestJS', category: 'BACKEND' });
  });

  it('rejects a duplicate name at the database level', async () => {
    await repository.create({ name: 'PHP', category: 'BACKEND' });

    await expect(repository.create({ name: 'PHP', category: 'BACKEND' })).rejects.toMatchObject({
      code: 'P2002',
    });
  });

  it('returns technologies in creation order', async () => {
    await repository.create({
      name: 'Zulu First Created',
      category: 'BACKEND',
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
    });
    await repository.create({
      name: 'Alpha Created Later',
      category: 'BACKEND',
      createdAt: new Date('2021-01-01T00:00:00.000Z'),
    });

    const technologies = await repository.findAll();

    expect(
      technologies
        .filter((technology) =>
          ['Zulu First Created', 'Alpha Created Later'].includes(technology.name),
        )
        .map((technology) => technology.name),
    ).toEqual(['Zulu First Created', 'Alpha Created Later']);
  });

  it('deletes an existing technology', async () => {
    const created = await repository.create({ name: 'Temp', category: 'BACKEND' });

    await repository.delete(created.id);

    await expect(repository.findById(created.id)).resolves.toBeNull();
  });
});
