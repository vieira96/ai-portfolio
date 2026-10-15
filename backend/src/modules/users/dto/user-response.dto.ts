import { ApiProperty } from '@nestjs/swagger';
import type { User } from '../../../generated/prisma/client.js';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true, required: false })
  headline?: string | null;

  @ApiProperty({ nullable: true, required: false })
  bio?: string | null;

  @ApiProperty({ nullable: true, required: false })
  location?: string | null;

  @ApiProperty({ nullable: true, required: false })
  githubUrl?: string | null;

  @ApiProperty({ nullable: true, required: false })
  linkedinUrl?: string | null;

  @ApiProperty({ nullable: true, required: false })
  portfolioUrl?: string | null;

  @ApiProperty({ nullable: true, required: false })
  avatarUrl?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static from(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      headline: user.headline,
      bio: user.bio,
      location: user.location,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,
      portfolioUrl: user.portfolioUrl,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
