import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import {
  TestAppContext,
  setupTestApp,
  teardownTestApp,
} from '../../../test/helpers/e2e-setup.helper.js';

describe('AI health (e2e)', () => {
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

});
