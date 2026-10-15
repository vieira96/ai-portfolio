import { ApiProperty } from '@nestjs/swagger';
import type { User } from '../../../generated/prisma/client.js';
import { UserResponseDto } from './user-response.dto.js';

export class AuthenticatedUserResponseDto extends UserResponseDto {
  @ApiProperty({ nullable: true })
  phone: string | null;

  static from(user: User): AuthenticatedUserResponseDto {
    return Object.assign(
      new AuthenticatedUserResponseDto(),
      UserResponseDto.from(user),
      { phone: user.phone },
    );
  }
}
