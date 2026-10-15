import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { vi } from 'vitest';
import { TechnologyRepository } from '../repositories/technology.repository.js';
import { TechnologiesService } from './technologies.service.js';

describe('TechnologiesService', () => {
  let technologiesService: TechnologiesService;

  const technologyRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    findByName: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechnologiesService,
        { provide: TechnologyRepository, useValue: technologyRepository },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    technologiesService = module.get<TechnologiesService>(TechnologiesService);
  });

  describe('create', () => {
    it('creates and returns the technology', async () => {
      technologyRepository.findByName.mockResolvedValue(null);
      technologyRepository.create.mockResolvedValue(technology);

      const result = await technologiesService.create({
        name: 'NestJS',
        category: 'BACKEND',
      });

      expect(technologyRepository.create).toHaveBeenCalledWith({
        name: 'NestJS',
        category: 'BACKEND',
      });
      expect(result).toMatchObject({ id: 'tech-id-1', name: 'NestJS' });
    });

    it('throws 409 on duplicate name', async () => {
      technologyRepository.findByName.mockResolvedValue(technology);

      await expect(
        technologiesService.create({ name: 'NestJS', category: 'BACKEND' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(technologyRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws 409 when renaming to an existing name', async () => {
      technologyRepository.findById.mockResolvedValue(technology);
      technologyRepository.findByName.mockResolvedValue({
        ...technology,
        id: 'tech-id-2',
      });
      technologyRepository.update.mockResolvedValue({
        ...technology,
        name: 'Laravel',
      });

      await expect(
        technologiesService.update('tech-id-1', { name: 'Laravel' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('skips the duplicate check when the name is unchanged', async () => {
      technologyRepository.findById.mockResolvedValue(technology);
      technologyRepository.update.mockResolvedValue(technology);

      await technologiesService.update('tech-id-1', { category: 'IA' });

      expect(technologyRepository.findByName).not.toHaveBeenCalled();
    });

    it('throws 404 when the technology does not exist', async () => {
      technologyRepository.findById.mockResolvedValue(null);

      await expect(
        technologiesService.update('missing-id', { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('resolveTechnologyIds', () => {
    const mockTx = {
      technology: {
        upsert: vi.fn(),
      },
    };

    it('passes through ids without touching the database', async () => {
      const ids = await technologiesService.resolveTechnologyIds(
        [{ id: 'tech-id-1', name: 'NestJS', category: 'BACKEND' }],
        mockTx as never,
      );

      expect(ids).toEqual(['tech-id-1']);
      expect(mockTx.technology.upsert).not.toHaveBeenCalled();
    });

    it('upserts skills without id and mixes both', async () => {
      mockTx.technology.upsert.mockResolvedValue({
        ...technology,
        id: 'tech-new-1',
        name: 'Rust',
      });

      const ids = await technologiesService.resolveTechnologyIds(
        [
          { id: 'tech-id-1', name: 'NestJS', category: 'BACKEND' },
          { name: 'Rust', category: 'BACKEND' },
        ],
        mockTx as never,
      );

      expect(ids).toEqual(['tech-id-1', 'tech-new-1']);
      expect(mockTx.technology.upsert).toHaveBeenCalledTimes(1);
      expect(mockTx.technology.upsert).toHaveBeenCalledWith({
        where: { name: 'Rust' },
        create: { name: 'Rust', category: 'BACKEND' },
        update: {},
      });
    });
  });

  describe('delete', () => {
    it('throws 404 when the technology does not exist', async () => {
      technologyRepository.findById.mockResolvedValue(null);

      await expect(
        technologiesService.delete('missing-id'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(technologyRepository.delete).not.toHaveBeenCalled();
    });
  });
});
