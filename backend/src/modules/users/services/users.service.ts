import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { FileStorageService } from '../../../infra/storage/file-storage.service.js';
import { AuthenticatedUserResponseDto } from '../dto/authenticated-user-response.dto.js';
import { UserResponseDto } from '../dto/user-response.dto.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';
import { UserRepository } from '../repositories/user.repository.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly fileStorageService: FileStorageService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UsersService.name);
  }

  async getPublicProfile(): Promise<UserResponseDto> {
    const owner = await this.userRepository.findFirst();

    if (owner === null) {
      throw new NotFoundException('Profile not found');
    }

    return UserResponseDto.from(owner);
  }

  async updateProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<AuthenticatedUserResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (user === null) {
      throw new NotFoundException('User not found');
    }

    this.logger.info({ userId, fields: Object.keys(updateUserDto) });

    const updated = await this.userRepository.update(userId, updateUserDto);

    if (
      updateUserDto.avatarUrl !== undefined &&
      user.avatarUrl &&
      user.avatarUrl !== updateUserDto.avatarUrl
    ) {
      await this.fileStorageService.delete(user.avatarUrl);
    }

    return AuthenticatedUserResponseDto.from(updated);
  }
}
