import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function authMiddleware(request: NextRequest): NextResponse {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  if (!token && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}
