import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.['access_token'];

    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedException('Missing authentication');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        token,
        { secret: this.configService.getOrThrow<string>('JWT_SECRET') },
      );
      (request as Request & { user: AuthenticatedUser }).user = {
        id: payload.sub,
      };
    } catch {
      throw new UnauthorizedException('Invalid authentication');
    }

    return true;
  }
}
