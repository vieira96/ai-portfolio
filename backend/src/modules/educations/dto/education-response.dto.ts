import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Education } from '../../../generated/prisma/client.js';

export class EducationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  institution: string;

  @ApiProperty()
  course: string;

  @ApiPropertyOptional()
  degree?: string | null;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  startedAt?: Date | null;

  @ApiPropertyOptional()
  endedAt?: Date | null;

  @ApiPropertyOptional()
  expectedEnd?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static from(education: Education): EducationResponseDto {
    return {
      id: education.id,
      institution: education.institution,
      course: education.course,
      degree: education.degree,
      description: education.description,
      startedAt: education.startedAt,
      endedAt: education.endedAt,
      expectedEnd: education.expectedEnd,
      createdAt: education.createdAt,
      updatedAt: education.updatedAt,
    };
  }
}
