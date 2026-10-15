import { describe, expect, it } from 'vitest';
import { POST } from './route.js';

describe('POST /api/auth/logout', () => {
  it('clears the cookie', async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('access_token=');
    expect(setCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/);
  });
});
