import type { NextRequest } from 'next/server';
import { authMiddleware } from './middlewares/auth.middleware';

export function proxy(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/login'],
};
