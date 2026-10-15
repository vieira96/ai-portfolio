import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { vi } from 'vitest';
import { EducationRepository } from '../repositories/education.repository.js';
import { EducationsService } from './educations.service.js';

describe('EducationsService', () => {
  let educationsService: EducationsService;

  const educationRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findAllPaginated: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const logger = {
    setContext: vi.fn(),
    info: vi.fn(),
  };

  const education = {
    id: 'education-id-1',
    institution: 'USP',
    course: 'Ciência da Computação',
    degree: 'GRADUACAO',
    description: 'Bacharelado com ênfase em sistemas.',
    startedAt: new Date('2020-02-10'),
    endedAt: null,
    expectedEnd: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const baseDto = {
    institution: 'USP',
    course: 'Ciência da Computação',
    description: 'Bacharelado com ênfase em sistemas.',
    startedAt: '2020-02-10',
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EducationsService,
        { provide: EducationRepository, useValue: educationRepository },
        { provide: PinoLogger, useValue: logger },
      ],
    }).compile();

    educationsService = module.get<EducationsService>(EducationsService);
  });

  describe('create', () => {
    it('creates and returns the education', async () => {
      educationRepository.create.mockResolvedValue(education);

      const result = await educationsService.create(baseDto);

      expect(educationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          institution: 'USP',
          startedAt: new Date('2020-02-10'),
        }),
      );
      expect(result).toMatchObject({ id: 'education-id-1' });
    });

    it('throws 400 when startedAt is after endedAt', async () => {
      await expect(
        educationsService.create({
          ...baseDto,
          startedAt: '2024-06-30',
          endedAt: '2023-01-15',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(educationRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('paginates with size 2 by default', async () => {
      educationRepository.findAllPaginated.mockResolvedValue({
        items: [education],
        total: 1,
      });

      const result = await educationsService.findAll({});

      expect(educationRepository.findAllPaginated).toHaveBeenCalledWith(1, 2);
      expect(result).toMatchObject({ total: 1, page: 1, totalPages: 1 });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('throws 404 when the education does not exist', async () => {
      educationRepository.findById.mockResolvedValue(null);

      await expect(
        educationsService.findOne('missing-id'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws 404 when the education does not exist', async () => {
      educationRepository.findById.mockResolvedValue(null);

      await expect(
        educationsService.update('missing-id', { course: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws 400 when the new endedAt is before the existing startedAt', async () => {
      educationRepository.findById.mockResolvedValue(education);

      await expect(
        educationsService.update('education-id-1', {
          endedAt: '2019-01-01',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(educationRepository.update).not.toHaveBeenCalled();
    });

    it('updates and returns the education', async () => {
      educationRepository.findById.mockResolvedValue(education);
      educationRepository.update.mockResolvedValue({
        ...education,
        course: 'Engenharia de Software',
      });

      const result = await educationsService.update('education-id-1', {
        course: 'Engenharia de Software',
      });

      expect(educationRepository.update).toHaveBeenCalledWith(
        'education-id-1',
        expect.objectContaining({ course: 'Engenharia de Software' }),
      );
      expect(result).toMatchObject({ id: 'education-id-1' });
    });
  });

  describe('delete', () => {
    it('throws 404 when the education does not exist', async () => {
      educationRepository.findById.mockResolvedValue(null);

      await expect(
        educationsService.delete('missing-id'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(educationRepository.delete).not.toHaveBeenCalled();
    });
  });
});
