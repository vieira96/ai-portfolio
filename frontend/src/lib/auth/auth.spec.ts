import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSession } from './auth.js';

const cookies = vi.fn();

vi.mock('next/headers', () => ({
  cookies: () => cookies(),
}));

describe('getSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 500 })),
    );
  });

  it('returns null without cookie', async () => {
    cookies.mockResolvedValue({ get: () => undefined });

    await expect(getSession()).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns the session on valid cookie', async () => {
    cookies.mockResolvedValue({ get: () => ({ value: 'token-123' }) });
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: '1', name: 'Test', email: 'a@b.com' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const session = await getSession();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({
        headers: expect.objectContaining({
          cookie: 'access_token=token-123',
        }),
      }),
    );
    expect(session).toMatchObject({ id: '1', email: 'a@b.com' });
  });

  it('returns null when the backend denies', async () => {
    cookies.mockResolvedValue({ get: () => ({ value: 'stale-token' }) });
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 401 }));

    await expect(getSession()).resolves.toBeNull();
  });
});
