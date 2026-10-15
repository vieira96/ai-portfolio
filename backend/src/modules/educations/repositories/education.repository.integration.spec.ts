import { ConfigService } from '@nestjs/config';
import { StartedTestContainer } from 'testcontainers';
import {
  applyMigrations,
  prepareDatabase,
  startPostgresContainer,
} from '../../../../test/helpers/e2e-setup.helper.js';
import { PrismaService } from '../../../infra/database/prisma.service.js';
import { EducationRepository } from './education.repository.js';

describe('EducationRepository (integration)', () => {
  let container: StartedTestContainer;
  let prismaService: PrismaService;
  let repository: EducationRepository;

  beforeAll(async () => {
    const started = await startPostgresContainer();
    container = started.container;

    try {
      await prepareDatabase(started.url);
      applyMigrations(started.url);

      const configService = {
        get: () => started.url,
        getOrThrow: () => started.url,
      } as unknown as ConfigService;
      prismaService = new PrismaService(configService);
      await prismaService.onModuleInit();
      repository = new EducationRepository(prismaService);
    } catch (error) {
      await started.container.stop();
      throw error;
    }
  });

  afterAll(async () => {
    await prismaService?.onModuleDestroy();
    await container?.stop();
  });

  it('creates and finds an education with a database uuid', async () => {
    const created = await repository.create({
      institution: 'USP',
      course: 'Ciência da Computação',
      startedAt: new Date('2020-02-10'),
    });

    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );

    const found = await repository.findById(created.id);

    expect(found).toMatchObject({ institution: 'USP' });
  });

  it('paginates with a consistent total', async () => {
    await repository.create({
      institution: 'P1',
      course: 'Course',
      startedAt: new Date('2020-01-01'),
    });
    await repository.create({
      institution: 'P2',
      course: 'Course',
      startedAt: new Date('2021-01-01'),
    });

    const first = await repository.findAllPaginated(1, 1);

    expect(first.total).toBeGreaterThanOrEqual(2);
    expect(first.items).toHaveLength(1);
  });

  it('deletes an existing education', async () => {
    const created = await repository.create({
      institution: 'Temp',
      course: 'Course',
      startedAt: new Date('2024-01-01'),
    });

    await repository.delete(created.id);

    await expect(repository.findById(created.id)).resolves.toBeNull();
  });
});
