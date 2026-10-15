import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const VISITOR_COOKIE_NAME = 'chat_visitor';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isVisitorId(value: unknown): value is string {
  return typeof value === 'string' && UUID_V4_PATTERN.test(value);
}

export function readVisitorCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) {
    return null;
  }
  const match = new RegExp(`${VISITOR_COOKIE_NAME}=([^;]+)`).exec(cookieHeader);
  const candidate = match?.[1]?.trim();
  return isVisitorId(candidate) ? (candidate as string) : null;
}

export function readVisitorId(req: Request): string | null {
  const visitorId = (req as { visitorId?: unknown }).visitorId;
  return isVisitorId(visitorId) ? visitorId : null;
}

export function visitorCookieMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.url?.startsWith('/socket.io/') && !req.url?.startsWith('/chat')) {
    next();
    return;
  }
  const current = readVisitorCookie(req.headers.cookie);
  const visitorId = current ?? randomUUID();
  (req as { visitorId?: string }).visitorId = visitorId;
  if (!current) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader(
      'Set-Cookie',
      `${VISITOR_COOKIE_NAME}=${visitorId}; Path=/; HttpOnly; SameSite=Lax${secure}`,
    );
  }
  next();
}
