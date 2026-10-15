import {
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const jwtService = {
    verifyAsync: vi.fn(),
  };
  const configService = {
    get: vi.fn(),
    getOrThrow: vi.fn(),
  };

  function contextWithCookies(
    cookies: Record<string, unknown> | undefined,
  ): ExecutionContext {
    const request = { cookies } as { cookies?: Record<string, unknown> };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('denies without cookie', async () => {
    const context = contextWithCookies(undefined);

    const error = await guard
      .canActivate(context)
      .catch((error: unknown) => error);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect((error as UnauthorizedException).message).toBe(
      'Missing authentication',
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('allows with a valid cookie and attaches the user', async () => {
    const request = { cookies: { access_token: 'valid-token' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-id-1' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request).toMatchObject({ user: { id: 'user-id-1' } });
  });

  it('denies on invalid signature', async () => {
    const context = contextWithCookies({ access_token: 'forged-token' });
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid signature'));

    const error = await guard
      .canActivate(context)
      .catch((error: unknown) => error);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect((error as UnauthorizedException).message).toBe(
      'Invalid authentication',
    );
  });

  it('denies on expired token', async () => {
    const context = contextWithCookies({ access_token: 'expired-token' });
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
