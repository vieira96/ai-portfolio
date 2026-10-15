import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TechnologyCategory } from '../../../generated/prisma/client.js';
import type { Technology } from '../../../generated/prisma/client.js';

export class TechnologyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ enum: TechnologyCategory })
  category?: TechnologyCategory | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static from(technology: Technology): TechnologyResponseDto {
    return {
      id: technology.id,
      name: technology.name,
      category: technology.category,
      createdAt: technology.createdAt,
      updatedAt: technology.updatedAt,
    };
  }
}
