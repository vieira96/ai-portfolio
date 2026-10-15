import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto.js';
import { PrismaService } from '../../../infra/database/prisma.service.js';
import { TechnologiesService } from '../../technologies/services/technologies.service.js';
import { CreateExperienceDto } from '../dto/create-experience.dto.js';
import { ExperiencePaginationQueryDto } from '../dto/experience-pagination-query.dto.js';
import { ExperienceResponseDto } from '../dto/experience-response.dto.js';
import { UpdateExperienceDto } from '../dto/update-experience.dto.js';
import { ExperienceRepository } from '../repositories/experience.repository.js';

const DEFAULT_PAGE_SIZE = 2;

@Injectable()
export class ExperiencesService {
  constructor(
    private readonly experienceRepository: ExperienceRepository,
    private readonly technologiesService: TechnologiesService,
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ExperiencesService.name);
  }

  async create(
    createExperienceDto: CreateExperienceDto,
  ): Promise<ExperienceResponseDto> {
    this.validateDates(
      createExperienceDto.startedAt,
      createExperienceDto.endedAt,
    );

    return this.prisma.$transaction(async (tx) => {
      const technologyIds =
        await this.technologiesService.resolveTechnologyIds(
          createExperienceDto.skills ?? [],
          tx,
        );

      this.logger.info({ company: createExperienceDto.company });
      const experience =
        await this.experienceRepository.createWithRelations(
          {
            data: {
              company: createExperienceDto.company,
              position: createExperienceDto.position,
              description: createExperienceDto.description,
              startedAt: new Date(createExperienceDto.startedAt),
              endedAt: createExperienceDto.endedAt
                ? new Date(createExperienceDto.endedAt)
                : undefined,
            },
            technologyIds,
          },
          tx,
        );
      return ExperienceResponseDto.from(experience);
    });
  }

  async findAll(
    pagination: ExperiencePaginationQueryDto,
  ): Promise<PaginatedResponseDto<ExperienceResponseDto>> {
    const page = pagination.page ?? 1;
    const size = pagination.size ?? DEFAULT_PAGE_SIZE;
    const { items, total } =
      await this.experienceRepository.findAllPaginated(page, size);

    return {
      data: items.map((experience) => ExperienceResponseDto.from(experience)),
      total,
      page,
      totalPages: Math.ceil(total / size),
    };
  }

  async findOne(id: string): Promise<ExperienceResponseDto> {
    const existing =
      await this.experienceRepository.findByIdWithRelations(id);

    if (existing === null) {
      throw new NotFoundException('Experience not found');
    }

    return ExperienceResponseDto.from(existing);
  }

  async update(
    id: string,
    updateExperienceDto: UpdateExperienceDto,
  ): Promise<ExperienceResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const existing =
        await this.experienceRepository.findByIdWithRelations(id);

      if (existing === null) {
        throw new NotFoundException('Experience not found');
      }

      const startedAt =
        updateExperienceDto.startedAt ?? existing.startedAt.toISOString();
      const endedAt =
        updateExperienceDto.endedAt === undefined
          ? (existing.endedAt?.toISOString() ?? null)
          : updateExperienceDto.endedAt;
      this.validateDates(startedAt, endedAt);

      const technologyIds =
        updateExperienceDto.skills === undefined
          ? undefined
          : await this.technologiesService.resolveTechnologyIds(
              updateExperienceDto.skills,
              tx,
            );

      const updated = await this.experienceRepository.updateWithRelations(
        id,
        {
          company: updateExperienceDto.company,
          position: updateExperienceDto.position,
          description: updateExperienceDto.description,
          startedAt:
            updateExperienceDto.startedAt === undefined
              ? undefined
              : new Date(updateExperienceDto.startedAt),
          endedAt:
            updateExperienceDto.endedAt === undefined
              ? undefined
              : updateExperienceDto.endedAt === null
                ? null
                : new Date(updateExperienceDto.endedAt),
        },
        technologyIds,
        tx,
      );
      return ExperienceResponseDto.from(updated);
    });
  }

  async delete(id: string): Promise<void> {
    const existing =
      await this.experienceRepository.findByIdWithRelations(id);

    if (existing === null) {
      throw new NotFoundException('Experience not found');
    }

    await this.experienceRepository.delete(id);
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
