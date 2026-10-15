import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, PATCH } from './route.js';

function buildRequest(
  url: string,
  method: string,
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
    method,
    headers,
    body: body === undefined ? null : JSON.stringify(body),
  });
}

describe('PATCH /api/projects/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('denies without cookie', async () => {
    const response = await PATCH(
      buildRequest('http://localhost/api/projects/p1', 'PATCH'),
      { params: Promise.resolve({ id: 'p1' }) },
    );

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('forwards cookie, id and body', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 'p1', name: 'New' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const response = await PATCH(
      buildRequest(
        'http://localhost/api/projects/p1',
        'PATCH',
        'access_token=abc',
        { name: 'New' },
      ),
      { params: Promise.resolve({ id: 'p1' }) },
    );

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/p1'),
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(response.status).toBe(200);
  });
});

describe('DELETE /api/projects/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('forwards 204 untouched', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    const response = await DELETE(
      buildRequest(
        'http://localhost/api/projects/p1',
        'DELETE',
        'access_token=abc',
      ),
      { params: Promise.resolve({ id: 'p1' }) },
    );

    expect(response.status).toBe(204);
  });

  it('denies without cookie', async () => {
    const response = await DELETE(
      buildRequest('http://localhost/api/projects/p1', 'DELETE'),
      { params: Promise.resolve({ id: 'p1' }) },
    );

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });
});
