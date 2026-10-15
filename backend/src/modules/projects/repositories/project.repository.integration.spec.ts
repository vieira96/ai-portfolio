import { ConfigService } from '@nestjs/config';
import { StartedTestContainer } from 'testcontainers';
import {
  applyMigrations,
  prepareDatabase,
  startPostgresContainer,
} from '../../../../test/helpers/e2e-setup.helper.js';
import { PrismaService } from '../../../infra/database/prisma.service.js';
import { ProjectRepository } from './project.repository.js';

describe('ProjectRepository (integration)', () => {
  let container: StartedTestContainer;
  let prismaService: PrismaService;
  let repository: ProjectRepository;

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
      repository = new ProjectRepository(prismaService);
    } catch (error) {
      await started.container.stop();
      throw error;
    }
  });

  afterAll(async () => {
    await prismaService?.onModuleDestroy();
    await container?.stop();
  });

  it('creates a project with technologies in one transaction', async () => {
    const technology = await prismaService.technology.create({
      data: { name: 'NestJS', category: 'BACKEND' },
    });

    const created = await repository.createWithRelations({
      data: {
        name: 'Auth API',
        description: 'API de autenticação com JWT.',
      },
      technologyIds: [technology.id],
    });

    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(created.technologies).toHaveLength(1);
    expect(created.technologies[0].technology.name).toBe('NestJS');
  });

  it('paginates with a consistent total', async () => {
    await repository.createWithRelations({
      data: { name: 'P1', description: '0123456789' },
      technologyIds: [],
    });
    await repository.createWithRelations({
      data: { name: 'P2', description: '0123456789' },
      technologyIds: [],
    });

    const first = await repository.findAllPaginated(1, 1);

    expect(first.total).toBeGreaterThanOrEqual(2);
    expect(first.items).toHaveLength(1);
  });

  it('cascades pivot rows on delete', async () => {
    const created = await repository.createWithRelations({
      data: { name: 'Temp', description: '0123456789' },
      technologyIds: [],
    });

    await repository.delete(created.id);

    const pivots = await prismaService.projectTechnology.findMany({
      where: { projectId: created.id },
    });
    expect(pivots).toHaveLength(0);
  });
});
