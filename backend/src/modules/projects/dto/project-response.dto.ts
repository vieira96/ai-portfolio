import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Prisma } from '../../../generated/prisma/client.js';
import { TechnologyResponseDto } from '../../technologies/dto/technology-response.dto.js';

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: { technologies: { include: { technology: true } } };
}>;

export class ProjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  repositoryUrl?: string | null;

  @ApiPropertyOptional()
  demoUrl?: string | null;

  @ApiProperty({ type: [TechnologyResponseDto] })
  technologies: TechnologyResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static from(project: ProjectWithRelations): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      repositoryUrl: project.repositoryUrl,
      demoUrl: project.demoUrl,
      technologies: project.technologies.map((item) =>
        TechnologyResponseDto.from(item.technology),
      ),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
