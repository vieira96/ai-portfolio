import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TechnologyCategory } from '../../../generated/prisma/client.js';

export class ExperienceSkillInput {
  @ApiPropertyOptional({ example: 'a8098c1a-f86e-11da-bd1a-00112444be1e' })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'NestJS' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ enum: TechnologyCategory, example: 'BACKEND' })
  @IsEnum(TechnologyCategory)
  category: TechnologyCategory;
}

export class CreateExperienceDto {
  @ApiProperty({ example: 'Levante Lab' })
  @IsString()
  @MinLength(2)
  company: string;

  @ApiProperty({ example: 'Backend Developer' })
  @IsString()
  @MinLength(2)
  position: string;

  @ApiProperty({ example: 'APIs com NestJS e PostgreSQL.' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ example: '2023-01-15' })
  @IsDateString()
  startedAt: string;

  @ApiPropertyOptional({ example: '2024-06-30' })
  @IsDateString()
  @IsOptional()
  endedAt?: string;

  @ApiPropertyOptional({ type: [ExperienceSkillInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceSkillInput)
  @IsOptional()
  skills?: ExperienceSkillInput[];
}
