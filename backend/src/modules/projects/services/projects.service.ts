import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto.js';
import { PrismaService } from '../../../infra/database/prisma.service.js';
import { CreateProjectDto } from '../dto/create-project.dto.js';
import { ProjectResponseDto } from '../dto/project-response.dto.js';
import { UpdateProjectDto } from '../dto/update-project.dto.js';
import { ProjectRepository } from '../repositories/project.repository.js';
import { TechnologiesService } from '../../technologies/services/technologies.service.js';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly technologiesService: TechnologiesService,
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProjectsService.name);
  }

  async create(
    createProjectDto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const technologyIds =
        await this.technologiesService.resolveTechnologyIds(
          createProjectDto.skills ?? [],
          tx,
        );

      this.logger.info({ name: createProjectDto.name });
      const project = await this.projectRepository.createWithRelations(
        {
          data: {
            name: createProjectDto.name,
            description: createProjectDto.description,
            repositoryUrl: createProjectDto.repositoryUrl,
            demoUrl: createProjectDto.demoUrl,
          },
          technologyIds,
        },
        tx,
      );
      return ProjectResponseDto.from(project);
    });
  }

  async findAll(
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ProjectResponseDto>> {
    const page = pagination.page ?? 1;
    const size = pagination.size ?? 4;
    const { items, total } = await this.projectRepository.findAllPaginated(
      page,
      size,
    );

    return {
      data: items.map((project) => ProjectResponseDto.from(project)),
      total,
      page,
      totalPages: Math.ceil(total / size),
    };
  }

  async findOne(id: string): Promise<ProjectResponseDto> {
    const existing = await this.projectRepository.findByIdWithRelations(id);

    if (existing === null) {
      throw new NotFoundException('Project not found');
    }

    return ProjectResponseDto.from(existing);
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.projectRepository.findByIdWithRelations(id);

      if (existing === null) {
        throw new NotFoundException('Project not found');
      }

      const technologyIds =
        updateProjectDto.skills === undefined
          ? undefined
          : await this.technologiesService.resolveTechnologyIds(
              updateProjectDto.skills,
              tx,
            );

      const updated = await this.projectRepository.updateWithRelations(
        id,
        {
          name: updateProjectDto.name,
          description: updateProjectDto.description,
          repositoryUrl: updateProjectDto.repositoryUrl,
          demoUrl: updateProjectDto.demoUrl,
        },
        technologyIds,
        tx,
      );
      return ProjectResponseDto.from(updated);
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await this.projectRepository.findByIdWithRelations(id);

    if (existing === null) {
      throw new NotFoundException('Project not found');
    }

    await this.projectRepository.delete(id);
  }

}
