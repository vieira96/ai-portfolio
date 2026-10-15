import { describe, expect, it, vi } from 'vitest';
import {
  VISITOR_COOKIE_NAME,
  visitorCookieMiddleware,
} from './visitor-cookie.middleware.js';

type MiddlewareParameters = Parameters<typeof visitorCookieMiddleware>;

describe('visitorCookieMiddleware', () => {
  const validId = '123e4567-e89b-42d3-a456-426614174000';

  function run(url: string | undefined, cookie: string | undefined) {
    const req = { url, headers: { cookie } } as unknown as
      MiddlewareParameters[0] & { visitorId?: string };
    const setHeader = vi.fn();
    const res = { setHeader } as unknown as MiddlewareParameters[1];
    const next = vi.fn();
    visitorCookieMiddleware(req, res, next);
    return { req, setHeader, next };
  }

  it('skips paths outside socket and chat untouched', () => {
    const { req, setHeader, next } = run('/projects', undefined);

    expect(next).toHaveBeenCalledOnce();
    expect(req.visitorId).toBeUndefined();
    expect(setHeader).not.toHaveBeenCalled();
  });

  it('generates an id and sets the cookie on first contact', () => {
    const { req, setHeader, next } = run(
      '/socket.io/?EIO=4&transport=polling',
      undefined,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(req.visitorId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(setHeader).toHaveBeenCalledOnce();
    expect(setHeader.mock.calls[0][0]).toBe('Set-Cookie');
    expect(String(setHeader.mock.calls[0][1])).toContain(
      `${VISITOR_COOKIE_NAME}=${req.visitorId}`,
    );
    expect(String(setHeader.mock.calls[0][1])).toContain('HttpOnly');
  });

  it('keeps a valid cookie without setting a new one', () => {
    const { req, setHeader, next } = run(
      '/socket.io/?EIO=4&transport=polling',
      `${VISITOR_COOKIE_NAME}=${validId}`,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(req.visitorId).toBe(validId);
    expect(setHeader).not.toHaveBeenCalled();
  });

  it('regenerates when the cookie is malformed', () => {
    const { req, setHeader, next } = run(
      '/socket.io/?EIO=4&transport=polling',
      `${VISITOR_COOKIE_NAME}=not-a-uuid`,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(req.visitorId).not.toBe('not-a-uuid');
    expect(req.visitorId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(setHeader).toHaveBeenCalledOnce();
  });

  it('generates an id and sets the cookie on chat REST first contact', () => {
    const { req, setHeader, next } = run('/chat/messages', undefined);

    expect(next).toHaveBeenCalledOnce();
    expect(req.visitorId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(setHeader).toHaveBeenCalledOnce();
    expect(String(setHeader.mock.calls[0][1])).toContain(
      `${VISITOR_COOKIE_NAME}=${req.visitorId}`,
    );
  });

  it('keeps a valid cookie on chat REST without setting a new one', () => {
    const { req, setHeader, next } = run(
      '/chat/messages?page=1',
      `${VISITOR_COOKIE_NAME}=${validId}`,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(req.visitorId).toBe(validId);
    expect(setHeader).not.toHaveBeenCalled();
  });
});
