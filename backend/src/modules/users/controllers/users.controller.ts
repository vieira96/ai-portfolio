import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import {
  AuthenticatedUser,
  JwtAuthGuard,
} from '../../auth/guards/jwt-auth.guard.js';
import { AuthenticatedUserResponseDto } from '../dto/authenticated-user-response.dto.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';
import { UserResponseDto } from '../dto/user-response.dto.js';
import { UsersService } from '../services/users.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: '/users/profile' })
  @ApiResponse({
    status: 200,
    description: 'Public portfolio owner profile',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getPublicProfile(): Promise<UserResponseDto> {
    return this.usersService.getPublicProfile();
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: '/users/me' })
  @ApiResponse({
    status: 200,
    description: 'Updated profile',
    type: AuthenticatedUserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication',
  })
  async updateMe(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<AuthenticatedUserResponseDto> {
    return this.usersService.updateProfile(request.user.id, updateUserDto);
  }
}
