import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  TestAppContext,
  setupTestApp,
  teardownTestApp,
} from '../../../test/helpers/e2e-setup.helper.js';

describe('Experiences (e2e)', () => {
  let app: INestApplication;
  let context: TestAppContext;

  const testEmail = 'e2e-experiences@example.com';
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
      name: 'E2E Experiences',
      email: testEmail,
      password: testPassword,
    });
    app = context.app;
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  it('creates with skills (linking and creating) and reads paginated', async () => {
    const agent = await loginAgent();

    const created = await agent
      .post('/experiences')
      .send({
        company: 'Levante Lab',
        position: 'Backend Developer',
        description: 'API de autenticação com JWT.',
        startedAt: '2023-01-15',
        skills: [
          { name: 'NestJS', category: 'BACKEND' },
          { name: 'Rust', category: 'BACKEND' },
        ],
      })
      .expect(201);

    expect(created.body).toMatchObject({ company: 'Levante Lab' });
    expect(created.body.technologies).toHaveLength(2);

    const page = await agent.get('/experiences?page=1&size=2').expect(200);
    expect(page.body).toMatchObject({ total: 1, page: 1, totalPages: 1 });
    expect(page.body.data).toHaveLength(1);
  });

  it('rejects inverted dates with 400', async () => {
    const agent = await loginAgent();

    await agent
      .post('/experiences')
      .send({
        company: 'Bad Co',
        position: 'Dev',
        description: 'API de autenticação com JWT.',
        startedAt: '2024-06-30',
        endedAt: '2023-01-15',
      })
      .expect(400);
  });

  it('denies writes without cookie', async () => {
    await request(app.getHttpServer())
      .post('/experiences')
      .send({ company: 'X', position: 'Y', description: '0123456789' })
      .expect(401);
  });

  it('returns 404 on missing experience', async () => {
    const agent = await loginAgent();

    await agent
      .get('/experiences/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });
});
