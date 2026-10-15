import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  TestAppContext,
  setupTestApp,
  teardownTestApp,
} from '../../../test/helpers/e2e-setup.helper.js';

describe('Projects (e2e)', () => {
  let app: INestApplication;
  let context: TestAppContext;

  const testEmail = 'e2e-projects@example.com';
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
      name: 'E2E Projects',
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
      .post('/projects')
      .send({
        name: 'Auth API',
        description: 'API de autenticação com JWT.',
        skills: [
          { name: 'NestJS', category: 'BACKEND' },
          { name: 'Rust', category: 'BACKEND' },
        ],
      })
      .expect(201);

    expect(created.body).toMatchObject({ name: 'Auth API' });
    expect(created.body.technologies).toHaveLength(2);

    const page = await agent.get('/projects?page=1&size=4').expect(200);
    expect(page.body).toMatchObject({ total: 1, page: 1, totalPages: 1 });
    expect(page.body.data).toHaveLength(1);
  });

  it('reads one project with technologies', async () => {
    const agent = await loginAgent();

    const created = await agent
      .post('/projects')
      .send({
        name: 'Auth API',
        description: 'API de autenticação com JWT.',
        skills: [{ name: 'NestJS', category: 'BACKEND' }],
      })
      .expect(201);

    const found = await agent
      .get(`/projects/${created.body.id}`)
      .expect(200);

    expect(found.body).toMatchObject({ id: created.body.id });
    expect(found.body.technologies).toHaveLength(1);
  });

  it('returns 404 on missing project id', async () => {
    const agent = await loginAgent();

    await agent
      .get('/projects/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });

  it('denies writes without cookie', async () => {
    await request(app.getHttpServer())
      .post('/projects')
      .send({ name: 'X', description: '0123456789' })
      .expect(401);
  });

  it('returns 404 on missing project', async () => {
    const agent = await loginAgent();

    await agent
      .patch('/projects/00000000-0000-0000-0000-000000000000')
      .send({ name: 'Valid Name' })
      .expect(404);
  });
});
