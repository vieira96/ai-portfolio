import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  TestAppContext,
  setupTestApp,
  teardownTestApp,
} from '../../../test/helpers/e2e-setup.helper.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let context: TestAppContext;

  const testEmail = 'e2e@example.com';
  const testPassword = 'e2e-pass-123';

  async function authenticatedAgent(): Promise<
    ReturnType<typeof request.agent>
  > {
    const authenticated = request.agent(app.getHttpServer());
    await authenticated
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);
    return authenticated;
  }

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    context = await setupTestApp({
      name: 'E2E User',
      email: testEmail,
      password: testPassword,
    });
    app = context.app;
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  it('logs in setting an httpOnly cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);

    expect(response.body).toEqual({ ok: true });
    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies.join(';')).toContain('access_token=');
    expect(cookies.join(';')).toContain('HttpOnly');
  });

  it('rejects wrong password with 401', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'wrong-pass-1' })
      .expect(401);
  });

  it('returns the profile on /auth/me with the session cookie', async () => {
    const agent = await authenticatedAgent();
    const response = await agent.get('/auth/me').expect(200);

    expect(response.body).toMatchObject({ email: testEmail });
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('denies /auth/me without cookie', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('clears the session on logout', async () => {
    const agent = await authenticatedAgent();
    await agent.post('/auth/logout').expect(200);
    await agent.get('/auth/me').expect(401);
  });
});
