import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import {
  TestAppContext,
  setupTestApp,
  teardownTestApp,
} from '../../../test/helpers/e2e-setup.helper.js';

describe('AI endpoints (e2e)', () => {
  let app: INestApplication;
  let context: TestAppContext;
  const fetchMock = vi.fn();

  beforeAll(async () => {
    vi.stubGlobal('fetch', fetchMock);
    context = await setupTestApp({
      name: 'E2E AI',
      email: 'e2e-ai@example.com',
      password: 'e2e-pass-123',
    });
    app = context.app;
  });

  afterAll(async () => {
    await teardownTestApp(context);
    vi.unstubAllGlobals();
  });

  it('returns ok when the model answers', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ response: 'qwen ok' }), { status: 200 }),
    );

    const response = await request(app.getHttpServer())
      .get('/ai/health')
      .expect(200);

    expect(response.body).toEqual({ status: 'ok', model: 'qwen2.5:7b' });
  });

  it('returns unavailable without secrets when the provider is down', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const response = await request(app.getHttpServer())
      .get('/ai/health')
      .expect(200);

    expect(response.body).toEqual({
      status: 'unavailable',
      model: 'qwen2.5:7b',
    });
  });

  it('requires authentication for writing assistance', async () => {
    await request(app.getHttpServer())
      .post('/ai/writing-assistance')
      .send({ fieldType: 'bio', text: 'Bio profissional original.' })
      .expect(401);
  });

  it('returns a suggestion for an authenticated request', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'e2e-ai@example.com', password: 'e2e-pass-123' })
      .expect(200);
    const cookie = (login.headers['set-cookie'] as string[])[0].split(';')[0];

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ response: 'Bio profissional revisada.' }), {
        status: 200,
      }),
    );

    const response = await request(app.getHttpServer())
      .post('/ai/writing-assistance')
      .set('Cookie', cookie)
      .send({ fieldType: 'bio', text: 'Bio profissional original.' })
      .expect(201);

    expect(response.body).toEqual({
      suggestion: 'Bio profissional revisada.',
    });
  });

  it('rejects unknown field types and empty text before calling the provider', async () => {
    await request(app.getHttpServer())
      .post('/ai/writing-assistance')
      .send({ fieldType: 'summary', text: 'Bio profissional original.' })
      .expect(401);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'e2e-ai@example.com', password: 'e2e-pass-123' })
      .expect(200);
    const cookie = (login.headers['set-cookie'] as string[])[0].split(';')[0];
    const callCount = fetchMock.mock.calls.length;

    await request(app.getHttpServer())
      .post('/ai/writing-assistance')
      .set('Cookie', cookie)
      .send({ fieldType: 'summary', text: 'Bio profissional original.' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/ai/writing-assistance')
      .set('Cookie', cookie)
      .send({ fieldType: 'bio', text: '' })
      .expect(400);

    expect(fetchMock).toHaveBeenCalledTimes(callCount);
  });

  it('returns a sanitized error when the provider is unavailable', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'e2e-ai@example.com', password: 'e2e-pass-123' })
      .expect(200);
    const cookie = (login.headers['set-cookie'] as string[])[0].split(';')[0];
    fetchMock.mockRejectedValueOnce(new Error('provider internal detail'));

    const response = await request(app.getHttpServer())
      .post('/ai/writing-assistance')
      .set('Cookie', cookie)
      .send({ fieldType: 'bio', text: 'Bio original.' })
      .expect(500);

    expect(response.body.message).toBe('Internal server error');
    expect(JSON.stringify(response.body)).not.toContain(
      'provider internal detail',
    );
  });
});
