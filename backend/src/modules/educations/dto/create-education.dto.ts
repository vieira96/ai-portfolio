import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { EducationDegree } from '../../../generated/prisma/client.js';

export class CreateEducationDto {
  @ApiProperty({ example: 'USP' })
  @IsString()
  @MinLength(2)
  institution: string;

  @ApiProperty({ example: 'Ciência da Computação' })
  @IsString()
  @MinLength(2)
  course: string;

  @ApiPropertyOptional({ enum: EducationDegree, example: 'GRADUACAO' })
  @IsEnum(EducationDegree)
  @IsOptional()
  degree?: EducationDegree;

  @ApiPropertyOptional({ example: 'Bacharelado com ênfase em sistemas.' })
  @IsString()
  @MinLength(10)
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2020-02-10' })
  @IsDateString()
  startedAt: string;

  @ApiPropertyOptional({ example: '2024-12-20' })
  @IsDateString()
  @IsOptional()
  endedAt?: string;

  @ApiPropertyOptional({ example: '2025-06-30' })
  @IsDateString()
  @IsOptional()
  expectedEnd?: string;
}
