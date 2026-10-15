import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { CookieOptions } from 'express';
import { AuthenticatedUserResponseDto } from '../../users/dto/authenticated-user-response.dto.js';
import { UserRepository } from '../../users/repositories/user.repository.js';
import { LoginDto } from '../dto/login.dto.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.userRepository.findByEmail(dto.email);
    const passwordValid =
      user !== null && (await compare(dto.password, user.passwordHash));

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.jwtService.signAsync({ sub: user.id });
    return { accessToken };
  }

  async getProfile(userId: string): Promise<AuthenticatedUserResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (user === null) {
      throw new UnauthorizedException('Invalid authentication');
    }

    return AuthenticatedUserResponseDto.from(user);
  }

  buildCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: SEVEN_DAYS_MS,
      path: '/',
    };
  }
}
