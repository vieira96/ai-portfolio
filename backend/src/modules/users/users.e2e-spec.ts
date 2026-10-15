import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  TestAppContext,
  setupTestApp,
  teardownTestApp,
} from '../../../test/helpers/e2e-setup.helper.js';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let context: TestAppContext;

  const testEmail = 'e2e-users@example.com';
  const testPassword = 'e2e-pass-123';

  async function loginAgent(): Promise<ReturnType<typeof request.agent>> {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);
    return agent;
  }

  beforeAll(async () => {
    context = await setupTestApp({
      name: 'E2E Users',
      email: testEmail,
      password: testPassword,
    });
    app = context.app;
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  it('updates the own profile and persists', async () => {
    const agent = await loginAgent();

    const response = await agent
      .patch('/users/me')
      .send({ headline: 'E2E Headline' })
      .expect(200);

    expect(response.body).toMatchObject({ headline: 'E2E Headline' });

    const profile = await agent.get('/auth/me').expect(200);
    expect(profile.body).toMatchObject({ headline: 'E2E Headline' });
  });

  it('updates, normalizes and removes the authenticated user phone', async () => {
    const agent = await loginAgent();

    const updated = await agent
      .patch('/users/me')
      .send({ phone: ' +55 (21) 99999-9999 ' })
      .expect(200);

    expect(updated.body.phone).toBe('+55 (21) 99999-9999');
    const persisted = await agent.get('/auth/me').expect(200);
    expect(persisted.body.phone).toBe('+55 (21) 99999-9999');

    const publicProfile = await request(app.getHttpServer())
      .get('/users/profile')
      .expect(200);
    expect(publicProfile.body).not.toHaveProperty('phone');

    const cleared = await agent.patch('/users/me').send({ phone: '   ' }).expect(200);
    expect(cleared.body.phone).toBeNull();
    const profile = await agent.get('/auth/me').expect(200);
    expect(profile.body.phone).toBeNull();
  });

  it('rejects a phone longer than 30 characters without changing the saved value', async () => {
    const agent = await loginAgent();
    await agent.patch('/users/me').send({ phone: '+55 21 99999-9999' }).expect(200);

    await agent.patch('/users/me').send({ phone: '1'.repeat(31) }).expect(400);

    const profile = await agent.get('/auth/me').expect(200);
    expect(profile.body.phone).toBe('+55 21 99999-9999');
  });

  it('serves the public profile without cookie', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/profile')
      .expect(200);

    expect(response.body).toMatchObject({ email: testEmail });
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.body).not.toHaveProperty('phone');
  });

  it('denies without cookie', async () => {
    await request(app.getHttpServer())
      .patch('/users/me')
      .send({ headline: 'Nope' })
      .expect(401);
  });

  it('rejects invalid body with 400', async () => {
    const agent = await loginAgent();

    const response = await agent
      .patch('/users/me')
      .send({ githubUrl: 'not-a-url' })
      .expect(400);

    expect(JSON.stringify(response.body.message)).toContain('githubUrl');
  });
});
