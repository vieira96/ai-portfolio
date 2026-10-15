import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcrypt';
import { vi } from 'vitest';
import { UserRepository } from '../../users/repositories/user.repository.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let authService: AuthService;

  const userRepository = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
  };
  const jwtService = {
    signAsync: vi.fn(),
  };
  const configService = {
    get: vi.fn(),
  };

  const user = {
    id: 'b24d5b69-db9b-480a-b561-46261c0308f8',
    name: 'Test User',
    email: 'voce@example.com',
    passwordHash: '',
    headline: null,
    bio: null,
    location: null,
    githubUrl: null,
    linkedinUrl: null,
    portfolioUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    user.passwordHash = await hash('correct-password', 4);
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: userRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('returns a token on valid credentials', async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      jwtService.signAsync.mockResolvedValue('signed-token');

      await expect(
        authService.login({ email: user.email, password: 'correct-password' }),
      ).resolves.toEqual({ accessToken: 'signed-token' });
      expect(userRepository.findByEmail).toHaveBeenCalledWith(user.email);
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: user.id });
    });

    it('throws 401 when the user does not exist', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const email = 'ghost@example.com';

      const login = authService.login({ email, password: 'any-pass-1' });

      await expect(login).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(login).rejects.toMatchObject({
        message: 'Invalid credentials',
      });
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('throws 401 on wrong password with a generic message', async () => {
      userRepository.findByEmail.mockResolvedValue(user);

      const error = await authService
        .login({ email: user.email, password: 'wrong-pass-1' })
        .catch((error: unknown) => error);

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).message).toBe(
        'Invalid credentials',
      );
      expect(userRepository.findByEmail).toHaveBeenCalledWith(user.email);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('returns the profile without passwordHash', async () => {
      userRepository.findById.mockResolvedValue(user);

      const profile = await authService.getProfile(user.id);

      expect(userRepository.findById).toHaveBeenCalledWith(user.id);
      expect(profile).not.toHaveProperty('passwordHash');
      expect(profile).toMatchObject({ id: user.id, email: user.email });
    });

    it('throws 401 when the user no longer exists', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(authService.getProfile(user.id)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(userRepository.findById).toHaveBeenCalledWith(user.id);
    });
  });

  describe('buildCookieOptions', () => {
    it('marks the cookie secure in production', () => {
      configService.get.mockReturnValue('production');

      const options = authService.buildCookieOptions();

      expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
      expect(options).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
    });

    it('keeps the cookie insecure outside production', () => {
      configService.get.mockReturnValue('development');

      const options = authService.buildCookieOptions();

      expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
      expect(options.secure).toBe(false);
    });
  });
});
