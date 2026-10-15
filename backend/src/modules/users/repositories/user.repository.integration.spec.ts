import { ConfigService } from '@nestjs/config';
import { StartedTestContainer } from 'testcontainers';
import {
  applyMigrations,
  prepareDatabase,
  startPostgresContainer,
} from '../../../../test/helpers/e2e-setup.helper.js';
import { PrismaService } from '../../../infra/database/prisma.service.js';
import { UserRepository } from './user.repository.js';
import { seedUser } from '../../../../prisma/seeds/user/user.seed.js';

describe('UserRepository (integration)', () => {
  let container: StartedTestContainer;
  let prismaService: PrismaService;
  let repository: UserRepository;

  beforeAll(async () => {
    const started = await startPostgresContainer();
    container = started.container;

    try {
      await prepareDatabase(started.url);
      applyMigrations(started.url);

      process.env.SEED_USER_NAME = 'Seed User';
      process.env.SEED_USER_EMAIL = 'seed@example.com';
      process.env.SEED_USER_PASSWORD = 'seed-pass-1';

      const configService = {
        get: () => started.url,
        getOrThrow: () => started.url,
      } as unknown as ConfigService;
      prismaService = new PrismaService(configService);
      await prismaService.onModuleInit();
      repository = new UserRepository(prismaService);
    } catch (error) {
      await started.container.stop();
      throw error;
    }
  });

  afterAll(async () => {
    await prismaService?.onModuleDestroy();
    await container?.stop();
  });

  it('creates and finds a user by email with a database uuid', async () => {
    const created = await repository.create({
      name: 'Integration User',
      email: 'integration@example.com',
      passwordHash: 'hashed',
    });

    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );

    const found = await repository.findByEmail('integration@example.com');

    expect(found?.id).toBe(created.id);
  });

  it('seeds the single user idempotently', async () => {
    await seedUser(prismaService);
    await seedUser(prismaService);

    await expect(
      prismaService.user.count({ where: { email: 'seed@example.com' } }),
    ).resolves.toBe(1);
    await expect(
      prismaService.user.findFirstOrThrow({
        where: { email: 'seed@example.com' },
      }),
    ).resolves.toMatchObject({ name: 'Seed User' });
  });
});
