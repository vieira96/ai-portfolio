import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthenticatedUserResponseDto } from '../../users/dto/authenticated-user-response.dto.js';
import { LoginDto } from '../dto/login.dto.js';
import { AuthenticatedUser, JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { AuthService } from '../services/auth.service.js';

const ACCESS_TOKEN_COOKIE = 'access_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '/auth/login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Authenticated, cookie set' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ ok: true }> {
    const { accessToken } = await this.authService.login(loginDto);
    response.cookie(
      ACCESS_TOKEN_COOKIE,
      accessToken,
      this.authService.buildCookieOptions(),
    );
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '/auth/me' })
  @ApiResponse({
    status: 200,
    description: 'Profile without credentials',
    type: AuthenticatedUserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authentication',
  })
  async me(
    @Req() request: Request & { user: AuthenticatedUser },
  ): Promise<AuthenticatedUserResponseDto> {
    return this.authService.getProfile(request.user.id);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '/auth/logout' })
  @ApiResponse({ status: 200, description: 'Logged out, cookie cleared' })
  async logout(
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ ok: true }> {
    response.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    return { ok: true };
  }
}
