import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { TechnologyCategory } from '../../../generated/prisma/client.js';

export class CreateTechnologyDto {
  @ApiProperty({ example: 'NestJS' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ enum: TechnologyCategory, example: 'BACKEND' })
  @IsEnum(TechnologyCategory)
  category: TechnologyCategory;
}
