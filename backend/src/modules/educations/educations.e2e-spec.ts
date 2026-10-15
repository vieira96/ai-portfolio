import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  TestAppContext,
  setupTestApp,
  teardownTestApp,
} from '../../../test/helpers/e2e-setup.helper.js';

describe('Educations (e2e)', () => {
  let app: INestApplication;
  let context: TestAppContext;

  const testEmail = 'e2e-educations@example.com';
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
      name: 'E2E Educations',
      email: testEmail,
      password: testPassword,
    });
    app = context.app;
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  it('creates and reads paginated', async () => {
    const agent = await loginAgent();

    const created = await agent
      .post('/educations')
      .send({
        institution: 'USP',
        course: 'Ciência da Computação',
        degree: 'GRADUACAO',
        description: 'Bacharelado com ênfase em sistemas.',
        startedAt: '2020-02-10',
      })
      .expect(201);

    expect(created.body).toMatchObject({ institution: 'USP' });

    const page = await agent.get('/educations?page=1&size=2').expect(200);
    expect(page.body).toMatchObject({ total: 1, page: 1, totalPages: 1 });
    expect(page.body.data).toHaveLength(1);
  });

  it('rejects inverted dates with 400', async () => {
    const agent = await loginAgent();

    await agent
      .post('/educations')
      .send({
        institution: 'Bad Co',
        course: 'Course',
        startedAt: '2024-06-30',
        endedAt: '2023-01-15',
      })
      .expect(400);
  });

  it('denies writes without cookie', async () => {
    await request(app.getHttpServer())
      .post('/educations')
      .send({ institution: 'X', course: 'Y' })
      .expect(401);
  });

  it('returns 404 on missing education', async () => {
    const agent = await loginAgent();

    await agent
      .get('/educations/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });
});
