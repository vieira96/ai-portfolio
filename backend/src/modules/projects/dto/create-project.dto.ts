import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TechnologyCategory } from '../../../generated/prisma/client.js';

export class ProjectSkillInput {
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

export class CreateProjectDto {
  @ApiProperty({ example: 'Auth API' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'API de autenticação com JWT.' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiPropertyOptional({ example: 'https://github.com/user/repo' })
  @IsUrl()
  @IsOptional()
  repositoryUrl?: string;

  @ApiPropertyOptional({ example: 'https://demo.exemplo.com' })
  @IsUrl()
  @IsOptional()
  demoUrl?: string;

  @ApiPropertyOptional({ type: [ProjectSkillInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectSkillInput)
  @IsOptional()
  skills?: ProjectSkillInput[];
}
