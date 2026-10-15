import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route.js';

function loginRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function backendResponse(
  status: number,
  body: unknown,
  cookie?: string,
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (cookie) {
    headers['set-cookie'] = cookie;
  }
  return new Response(JSON.stringify(body), { status, headers });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('forwards the cookie on success', async () => {
    vi.mocked(fetch).mockResolvedValue(
      backendResponse(
        200,
        { ok: true },
        'access_token=abc; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax',
      ),
    );

    const response = await POST(
      loginRequest({ email: 'voce@example.com', password: 'password123' }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get('set-cookie')).toContain('access_token=abc');
  });

  it('passes 401 through without cookie', async () => {
    vi.mocked(fetch).mockResolvedValue(
      backendResponse(401, { statusCode: 401, message: 'Invalid credentials' }),
    );

    const response = await POST(
      loginRequest({ email: 'voce@example.com', password: 'wrong-pass-1' }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('passes validation errors through untouched', async () => {
    vi.mocked(fetch).mockResolvedValue(
      backendResponse(400, {
        statusCode: 400,
        message: ['email must be an email'],
      }),
    );

    const response = await POST(loginRequest({ password: 'password123' }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      statusCode: 400,
      message: ['email must be an email'],
    });
  });
});
