import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { vi } from 'vitest';
import { PrismaService } from '../../../infra/database/prisma.service.js';
import { TechnologiesService } from '../../technologies/services/technologies.service.js';
import { ExperienceRepository } from '../repositories/experience.repository.js';
import { ExperiencesService } from './experiences.service.js';

describe('ExperiencesService', () => {
  let experiencesService: ExperiencesService;

  const experienceRepository = {
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
  const experience = {
    id: 'experience-id-1',
    company: 'Levante Lab',
    position: 'Backend Developer',
    description: 'APIs com NestJS e PostgreSQL.',
    startedAt: new Date('2023-01-15'),
    endedAt: null,
    technologies: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTx = {
    technology: {
      upsert: vi.fn(),
    },
    experienceTechnology: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    experience: {
      create: vi.fn(),
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  const prismaService = {
    $transaction: vi.fn(async (callback) => callback(mockTx)),
  } as unknown as PrismaService;

  const baseDto = {
    company: 'Levante Lab',
    position: 'Backend Developer',
    description: 'APIs com NestJS e PostgreSQL.',
    startedAt: '2023-01-15',
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperiencesService,
        { provide: ExperienceRepository, useValue: experienceRepository },
        { provide: TechnologiesService, useValue: technologiesService },
        { provide: PrismaService, useValue: prismaService },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    experiencesService = module.get<ExperiencesService>(ExperiencesService);
  });

  describe('create', () => {
    it('resolves skill ids through TechnologiesService inside a transaction', async () => {
      technologiesService.resolveTechnologyIds.mockResolvedValue([
        technology.id,
      ]);
      experienceRepository.createWithRelations.mockResolvedValue(experience);

      const result = await experiencesService.create({
        ...baseDto,
        skills: [{ id: technology.id, name: 'NestJS', category: 'BACKEND' }],
      });

      expect(technologiesService.resolveTechnologyIds).toHaveBeenCalledWith(
        [{ id: technology.id, name: 'NestJS', category: 'BACKEND' }],
        mockTx,
      );
      expect(experienceRepository.createWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({ technologyIds: [technology.id] }),
        mockTx,
      );
      expect(result).toMatchObject({ id: 'experience-id-1' });
    });

    it('throws 400 when startedAt is after endedAt', async () => {
      await expect(
        experiencesService.create({
          ...baseDto,
          startedAt: '2024-06-30',
          endedAt: '2023-01-15',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(experienceRepository.createWithRelations).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('paginates with size 2 by default', async () => {
      experienceRepository.findAllPaginated.mockResolvedValue({
        items: [experience],
        total: 1,
      });

      const result = await experiencesService.findAll({});

      expect(experienceRepository.findAllPaginated).toHaveBeenCalledWith(1, 2);
      expect(result).toMatchObject({ total: 1, page: 1, totalPages: 1 });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('throws 404 when the experience does not exist', async () => {
      experienceRepository.findByIdWithRelations.mockResolvedValue(null);

      await expect(
        experiencesService.findOne('missing-id'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws 404 when the experience does not exist', async () => {
      experienceRepository.findByIdWithRelations.mockResolvedValue(null);

      await expect(
        experiencesService.update('missing-id', { position: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws 400 when the new endedAt is before the existing startedAt', async () => {
      experienceRepository.findByIdWithRelations.mockResolvedValue(experience);

      await expect(
        experiencesService.update('experience-id-1', {
          endedAt: '2022-01-01',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(experienceRepository.updateWithRelations).not.toHaveBeenCalled();
    });

    it('updates through TechnologiesService and the repository', async () => {
      experienceRepository.findByIdWithRelations.mockResolvedValue(experience);
      technologiesService.resolveTechnologyIds.mockResolvedValue([
        technology.id,
      ]);
      experienceRepository.updateWithRelations.mockResolvedValue({
        ...experience,
        position: 'Senior Backend Developer',
      });

      const result = await experiencesService.update('experience-id-1', {
        position: 'Senior Backend Developer',
        skills: [{ id: technology.id, name: 'NestJS', category: 'BACKEND' }],
      });

      expect(technologiesService.resolveTechnologyIds).toHaveBeenCalledWith(
        [{ id: technology.id, name: 'NestJS', category: 'BACKEND' }],
        mockTx,
      );
      expect(experienceRepository.updateWithRelations).toHaveBeenCalledWith(
        'experience-id-1',
        expect.objectContaining({ position: 'Senior Backend Developer' }),
        [technology.id],
        mockTx,
      );
      expect(result).toMatchObject({ id: 'experience-id-1' });
    });
  });

  describe('delete', () => {
    it('throws 404 when the experience does not exist', async () => {
      experienceRepository.findByIdWithRelations.mockResolvedValue(null);

      await expect(
        experiencesService.delete('missing-id'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(experienceRepository.delete).not.toHaveBeenCalled();
    });
  });
});
