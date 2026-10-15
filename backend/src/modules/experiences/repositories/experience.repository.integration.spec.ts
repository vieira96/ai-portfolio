import { ConfigService } from '@nestjs/config';
import { StartedTestContainer } from 'testcontainers';
import {
  applyMigrations,
  prepareDatabase,
  startPostgresContainer,
} from '../../../../test/helpers/e2e-setup.helper.js';
import { PrismaService } from '../../../infra/database/prisma.service.js';
import { ExperienceRepository } from './experience.repository.js';

describe('ExperienceRepository (integration)', () => {
  let container: StartedTestContainer;
  let prismaService: PrismaService;
  let repository: ExperienceRepository;

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
      repository = new ExperienceRepository(prismaService);
    } catch (error) {
      await started.container.stop();
      throw error;
    }
  });

  afterAll(async () => {
    await prismaService?.onModuleDestroy();
    await container?.stop();
  });

  it('creates an experience with technologies in one transaction', async () => {
    const technology = await prismaService.technology.create({
      data: { name: 'NestJS', category: 'BACKEND' },
    });

    const created = await repository.createWithRelations({
      data: {
        company: 'Levante Lab',
        position: 'Backend Developer',
        description: 'APIs com NestJS e PostgreSQL.',
        startedAt: new Date('2023-01-15'),
      },
      technologyIds: [technology.id],
    });

    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(created.technologies).toHaveLength(1);
    expect(created.technologies[0].technology.name).toBe('NestJS');
  });

  it('rolls back everything when the transaction throws', async () => {
    const technology = await prismaService.technology.create({
      data: { name: 'Rust', category: 'BACKEND' },
    });

    await expect(
      prismaService.$transaction(async (tx) => {
        await repository.createWithRelations(
          {
            data: {
              company: 'Temp Co',
              position: 'Dev',
              description: '0123456789',
              startedAt: new Date('2024-01-01'),
            },
            technologyIds: [technology.id],
          },
          tx,
        );
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    const leftovers = await prismaService.experience.findMany({
      where: { company: 'Temp Co' },
    });
    expect(leftovers).toHaveLength(0);
  });

  it('diffs technologies on update (adds, keeps and removes)', async () => {
    const kept = await prismaService.technology.create({
      data: { name: 'TypeScript', category: 'FRONTEND' },
    });
    const removed = await prismaService.technology.create({
      data: { name: 'PHP', category: 'BACKEND' },
    });
    const added = await prismaService.technology.create({
      data: { name: 'Go', category: 'BACKEND' },
    });

    const created = await repository.createWithRelations({
      data: {
        company: 'Diff Co',
        position: 'Dev',
        description: '0123456789',
        startedAt: new Date('2022-01-01'),
      },
      technologyIds: [kept.id, removed.id],
    });

    const updated = await repository.updateWithRelations(
      created.id,
      { position: 'Senior Dev' },
      [kept.id, added.id],
    );

    const names = updated.technologies
      .map((item) => item.technology.name)
      .sort();
    expect(names).toEqual(['Go', 'TypeScript']);
  });

  it('paginates with a consistent total', async () => {
    await repository.createWithRelations({
      data: {
        company: 'P1',
        position: 'Dev',
        description: '0123456789',
        startedAt: new Date('2020-01-01'),
      },
      technologyIds: [],
    });
    await repository.createWithRelations({
      data: {
        company: 'P2',
        position: 'Dev',
        description: '0123456789',
        startedAt: new Date('2021-01-01'),
      },
      technologyIds: [],
    });

    const first = await repository.findAllPaginated(1, 1);

    expect(first.total).toBeGreaterThanOrEqual(2);
    expect(first.items).toHaveLength(1);
  });

  it('cascades pivot rows on delete', async () => {
    const created = await repository.createWithRelations({
      data: {
        company: 'Temp',
        position: 'Dev',
        description: '0123456789',
        startedAt: new Date('2024-01-01'),
      },
      technologyIds: [],
    });

    await repository.delete(created.id);

    const pivots = await prismaService.experienceTechnology.findMany({
      where: { experienceId: created.id },
    });
    expect(pivots).toHaveLength(0);
  });
});
