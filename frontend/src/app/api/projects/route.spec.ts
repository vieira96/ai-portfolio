import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route.js';

function buildRequest(
  url: string,
  cookie?: string,
  body?: unknown,
): NextRequest {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (cookie) {
    headers.cookie = cookie;
  }
  return new NextRequest(url, {
    method: 'POST',
    headers,
    body: body === undefined ? null : JSON.stringify(body),
  });
}

describe('GET /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('forwards page and size untouched', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ data: [], total: 0, page: 2, totalPages: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const response = await GET(
      buildRequest('http://localhost/api/projects?page=2&size=4'),
    );

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects?page=2&size=4'),
      expect.anything(),
    );
    expect(response.status).toBe(200);
  });
});

describe('POST /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('denies without cookie', async () => {
    const response = await POST(
      buildRequest('http://localhost/api/projects'),
    );

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('creates forwarding cookie and body', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 'p1', name: 'Auth API' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const response = await POST(
      buildRequest('http://localhost/api/projects', 'access_token=abc', {
        name: 'Auth API',
        description: 'API de autenticação com JWT.',
      }),
    );

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(response.status).toBe(201);
  });
});
