import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  MaxLength,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Samuel Vieira' })
  @IsString()
  @MinLength(3)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'voce@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Backend / Full Stack Developer' })
  @IsString()
  @IsOptional()
  headline?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ example: 'Brasil · Remoto' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  githubUrl?: string;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  linkedinUrl?: string;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  portfolioUrl?: string;

  @ApiPropertyOptional({ example: 'avatars/uuid.png' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: '+55 (21) 99999-9999',
    maxLength: 30,
    nullable: true,
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @IsString()
  @MaxLength(30)
  @IsOptional()
  phone?: string | null;
}
