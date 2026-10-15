import {
  InternalServerErrorException,
  createParamDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { readVisitorId } from '../middlewares/visitor-cookie.middleware.js';

export function visitorIdFactory(
  _data: unknown,
  ctx: ExecutionContext,
): string {
  const req = ctx.switchToHttp().getRequest<Request>();
  const visitorId = readVisitorId(req);
  if (!visitorId) {
    // O middleware global (`visitorCookieMiddleware`, atuando em `/socket.io/*`
    // e `/chat/*`) sempre fixa `req.visitorId` antes do controller. Chegar aqui
    // sem ele é erro de fiação do servidor, nunca culpa da requisição.
    throw new InternalServerErrorException(
      'Chat visitor identification unavailable',
    );
  }
  return visitorId;
}

/**
 * `visitorId` anônimo do cookie `chat_visitor`, fixado pelo
 * `visitorCookieMiddleware` antes do controller. Uso:
 * `send(@VisitorId() visitorId: string, ...)`.
 */
export const VisitorId = createParamDecorator(visitorIdFactory);
