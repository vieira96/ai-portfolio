import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { vi } from 'vitest';
import { ProjectRepository } from '../repositories/project.repository.js';
import { ProjectsService } from './projects.service.js';
import { PrismaService } from '../../../infra/database/prisma.service.js';
import { TechnologiesService } from '../../technologies/services/technologies.service.js';

describe('ProjectsService', () => {
  let projectsService: ProjectsService;

  const projectRepository = {
    createWithRelations: vi.fn(),
    findByIdWithRelations: vi.fn(),
    findAllPaginated: vi.fn(),
    updateWithRelations: vi.fn(),
    delete: vi.fn(),
  };
  const technologiesService = {
    resolveTechnologyIds: vi.fn(),
  };
  const logger = {
    setContext: vi.fn(),
    info: vi.fn(),
  };

  const technology = {
    id: 'tech-id-1',
    name: 'NestJS',
    category: 'BACKEND',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const project = {
    id: 'project-id-1',
    name: 'Auth API',
    description: 'API de autenticação com JWT.',
    repositoryUrl: null,
    demoUrl: null,
    technologies: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTx = {
    technology: {
      upsert: vi.fn(),
    },
    projectTechnology: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    project: {
      create: vi.fn(),
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  const prismaService = {
    $transaction: vi.fn(async (callback) => callback(mockTx)),
    technology: {
      upsert: vi.fn(),
    },
    projectTechnology: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    project: {
      create: vi.fn(),
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findUnique: vi.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: ProjectRepository, useValue: projectRepository },
        { provide: TechnologiesService, useValue: technologiesService },
        { provide: PrismaService, useValue: prismaService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    projectsService = module.get<ProjectsService>(ProjectsService);
  });

  describe('create', () => {
    it('resolves skill ids through TechnologiesService', async () => {
      technologiesService.resolveTechnologyIds.mockResolvedValue([
        'tech-new-1',
        technology.id,
      ]);
      projectRepository.createWithRelations.mockResolvedValue(project);

      const result = await projectsService.create({
        name: 'Auth API',
        description: 'API de autenticação com JWT.',
        skills: [
          { name: 'Rust', category: 'BACKEND' },
          { name: 'NestJS', category: 'BACKEND' },
        ],
      });

      expect(
        technologiesService.resolveTechnologyIds,
      ).toHaveBeenCalledWith(
        [
          { name: 'Rust', category: 'BACKEND' },
          { name: 'NestJS', category: 'BACKEND' },
        ],
        mockTx,
      );
      expect(projectRepository.createWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({
          technologyIds: ['tech-new-1', technology.id],
        }),
        mockTx,
      );
      expect(result).toMatchObject({ id: 'project-id-1' });
    });

    it('creates without skills', async () => {
      technologiesService.resolveTechnologyIds.mockResolvedValue([]);
      projectRepository.createWithRelations.mockResolvedValue(project);

      await projectsService.create({
        name: 'Auth API',
        description: 'API de autenticação com JWT.',
      });

      expect(
        technologiesService.resolveTechnologyIds,
      ).toHaveBeenCalledWith([], mockTx);
      expect(projectRepository.createWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({ technologyIds: [] }),
        mockTx,
      );
    });
  });

  describe('findAll', () => {
    it('returns the paginated envelope', async () => {
      projectRepository.findAllPaginated.mockResolvedValue({
        items: [project],
        total: 1,
      });

      const result = await projectsService.findAll({ page: 1, size: 4 });

      expect(result).toMatchObject({ total: 1, page: 1, totalPages: 1 });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('returns the project with relations', async () => {
      projectRepository.findByIdWithRelations.mockResolvedValue(project);

      const result = await projectsService.findOne('project-id-1');

      expect(result).toMatchObject({ id: 'project-id-1' });
    });

    it('throws 404 when the project does not exist', async () => {
      projectRepository.findByIdWithRelations.mockResolvedValue(null);

      await expect(
        projectsService.findOne('missing-id'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws 404 when the project does not exist', async () => {
      projectRepository.findByIdWithRelations.mockResolvedValue(null);

      await expect(
        projectsService.update('missing-id', { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates project and diffs technologies (remove, add, keep)', async () => {
      projectRepository.findByIdWithRelations.mockResolvedValue(project);
      projectRepository.updateWithRelations.mockResolvedValue({
        ...project,
        technologies: [
          { technology: { ...technology, name: 'React' } },
        ],
      });
      technologiesService.resolveTechnologyIds.mockResolvedValue([
        'tech-new-2',
        'tech-new-3',
      ]);

      const result = await projectsService.update('project-id-1', {
        name: 'Auth API Updated',
        skills: [
          { name: 'React', category: 'FRONTEND' },
          { name: 'TypeScript', category: 'FRONTEND' },
        ],
      });

      expect(
        technologiesService.resolveTechnologyIds,
      ).toHaveBeenCalledWith(
        [
          { name: 'React', category: 'FRONTEND' },
          { name: 'TypeScript', category: 'FRONTEND' },
        ],
        mockTx,
      );
      expect(projectRepository.updateWithRelations).toHaveBeenCalledWith(
        'project-id-1',
        expect.objectContaining({ name: 'Auth API Updated' }),
        expect.arrayContaining(['tech-new-2', 'tech-new-3']),
        mockTx,
      );
      expect(result).toMatchObject({ id: 'project-id-1' });
    });
  });

  describe('delete', () => {
    it('throws 404 when the project does not exist', async () => {
      projectRepository.findByIdWithRelations.mockResolvedValue(null);

      await expect(
        projectsService.delete('missing-id'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(projectRepository.delete).not.toHaveBeenCalled();
    });
  });
});
