import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  TestAppContext,
  setupTestApp,
  teardownTestApp,
} from '../../../test/helpers/e2e-setup.helper.js';

describe('Uploads (e2e)', () => {
  let app: INestApplication;
  let context: TestAppContext;

  const testEmail = 'e2e-uploads@example.com';
  const testPassword = 'e2e-pass-123';
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );

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
      name: 'E2E Uploads',
      email: testEmail,
      password: testPassword,
    });
    app = context.app;
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  it('uploads an image and returns its url', async () => {
    const agent = await loginAgent();

    const response = await agent
      .post('/uploads')
      .attach('file', png, 'avatar.png')
      .expect(201);

    expect(response.body.url).toMatch(/^http:\/\/.+\/uploads\/avatars\/.+\.png$/);
  });

  it('denies without cookie', async () => {
    await request(app.getHttpServer())
      .post('/uploads')
      .attach('file', png, 'avatar.png')
      .expect(401);
  });

  it('rejects non-image with 400', async () => {
    const agent = await loginAgent();

    await agent
      .post('/uploads')
      .attach('file', Buffer.from('hello'), 'note.txt')
      .expect(400);
  });
});
