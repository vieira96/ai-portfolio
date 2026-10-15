import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto.js';
import { CreateEducationDto } from '../dto/create-education.dto.js';
import { ExperiencePaginationQueryDto } from '../../experiences/dto/experience-pagination-query.dto.js';
import { EducationResponseDto } from '../dto/education-response.dto.js';
import { UpdateEducationDto } from '../dto/update-education.dto.js';
import { EducationRepository } from '../repositories/education.repository.js';

const DEFAULT_PAGE_SIZE = 2;

@Injectable()
export class EducationsService {
  constructor(
    private readonly educationRepository: EducationRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EducationsService.name);
  }

  async create(
    createEducationDto: CreateEducationDto,
  ): Promise<EducationResponseDto> {
    this.validateDates(
      createEducationDto.startedAt,
      createEducationDto.endedAt,
    );

    this.logger.info({ institution: createEducationDto.institution });
    const education = await this.educationRepository.create({
      institution: createEducationDto.institution,
      course: createEducationDto.course,
      degree: createEducationDto.degree,
      description: createEducationDto.description,
      startedAt: new Date(createEducationDto.startedAt),
      endedAt: createEducationDto.endedAt
        ? new Date(createEducationDto.endedAt)
        : undefined,
      expectedEnd: createEducationDto.expectedEnd
        ? new Date(createEducationDto.expectedEnd)
        : undefined,
    });
    return EducationResponseDto.from(education);
  }

  async findAll(
    pagination: ExperiencePaginationQueryDto,
  ): Promise<PaginatedResponseDto<EducationResponseDto>> {
    const page = pagination.page ?? 1;
    const size = pagination.size ?? DEFAULT_PAGE_SIZE;
    const { items, total } =
      await this.educationRepository.findAllPaginated(page, size);

    return {
      data: items.map((education) => EducationResponseDto.from(education)),
      total,
      page,
      totalPages: Math.ceil(total / size),
    };
  }

  async findOne(id: string): Promise<EducationResponseDto> {
    const existing = await this.educationRepository.findById(id);

    if (existing === null) {
      throw new NotFoundException('Education not found');
    }

    return EducationResponseDto.from(existing);
  }

  async update(
    id: string,
    updateEducationDto: UpdateEducationDto,
  ): Promise<EducationResponseDto> {
    const existing = await this.educationRepository.findById(id);

    if (existing === null) {
      throw new NotFoundException('Education not found');
    }

    const startedAt =
      updateEducationDto.startedAt ?? existing.startedAt?.toISOString();
    const endedAt =
      updateEducationDto.endedAt === undefined
        ? (existing.endedAt?.toISOString() ?? null)
        : updateEducationDto.endedAt;
    this.validateDates(startedAt, endedAt);

    const updated = await this.educationRepository.update(id, {
      institution: updateEducationDto.institution,
      course: updateEducationDto.course,
      degree: updateEducationDto.degree,
      description: updateEducationDto.description,
          startedAt:
            updateEducationDto.startedAt === undefined ||
            updateEducationDto.startedAt === null
              ? undefined
              : new Date(updateEducationDto.startedAt),
      endedAt:
        updateEducationDto.endedAt === undefined
          ? undefined
          : updateEducationDto.endedAt === null
            ? null
            : new Date(updateEducationDto.endedAt),
      expectedEnd:
        updateEducationDto.expectedEnd === undefined
          ? undefined
          : updateEducationDto.expectedEnd === null
            ? null
            : new Date(updateEducationDto.expectedEnd),
    });
    return EducationResponseDto.from(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.educationRepository.findById(id);

    if (existing === null) {
      throw new NotFoundException('Education not found');
    }

    await this.educationRepository.delete(id);
  }

  private validateDates(
    startedAt?: string | Date | null,
    endedAt?: string | Date | null,
  ): void {
    if (
      startedAt &&
      endedAt &&
      new Date(startedAt).getTime() > new Date(endedAt).getTime()
    ) {
      throw new BadRequestException('startedAt must be before endedAt');
    }
  }
}
