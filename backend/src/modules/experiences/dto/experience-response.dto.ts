import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Prisma } from '../../../generated/prisma/client.js';
import { TechnologyResponseDto } from '../../technologies/dto/technology-response.dto.js';

export type ExperienceWithRelations = Prisma.ExperienceGetPayload<{
  include: { technologies: { include: { technology: true } } };
}>;

export class ExperienceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  company: string;

  @ApiProperty()
  position: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional()
  endedAt?: Date | null;

  @ApiProperty({ type: [TechnologyResponseDto] })
  technologies: TechnologyResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static from(experience: ExperienceWithRelations): ExperienceResponseDto {
    return {
      id: experience.id,
      company: experience.company,
      position: experience.position,
      description: experience.description,
      startedAt: experience.startedAt,
      endedAt: experience.endedAt,
      technologies: experience.technologies.map((item) =>
        TechnologyResponseDto.from(item.technology),
      ),
      createdAt: experience.createdAt,
      updatedAt: experience.updatedAt,
    };
  }
}
