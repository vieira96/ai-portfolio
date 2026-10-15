import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  TestAppContext,
  setupTestApp,
  teardownTestApp,
} from '../../../test/helpers/e2e-setup.helper.js';

describe('Technologies (e2e)', () => {
  let app: INestApplication;
  let context: TestAppContext;

  const testEmail = 'e2e-tech@example.com';
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
      name: 'E2E Tech',
      email: testEmail,
      password: testPassword,
    });
    app = context.app;
  });

  afterAll(async () => {
    await teardownTestApp(context);
  });

  it('lists publicly without cookie', async () => {
    await request(app.getHttpServer()).get('/technologies').expect(200);
  });

  it('runs the full managed cycle authenticated', async () => {
    const agent = await loginAgent();

    const created = await agent
      .post('/technologies')
      .send({ name: 'NestJS', category: 'BACKEND' })
      .expect(201);
    expect(created.body).toMatchObject({ name: 'NestJS' });

    await agent
      .post('/technologies')
      .send({ name: 'NestJS', category: 'BACKEND' })
      .expect(409);

    const listed = await agent.get('/technologies').expect(200);
    expect(listed.body.map((item: { name: string }) => item.name)).toContain(
      'NestJS',
    );

    const updated = await agent
      .patch(`/technologies/${created.body.id}`)
      .send({ category: 'IA' })
      .expect(200);
    expect(updated.body).toMatchObject({ category: 'IA' });

    await agent.delete(`/technologies/${created.body.id}`).expect(204);

    const messagingSkill = await agent
      .post('/technologies')
      .send({ name: 'RabbitMQ E2E', category: 'MENSAGERIA' })
      .expect(201);
    expect(messagingSkill.body).toMatchObject({ category: 'MENSAGERIA' });
    await agent.delete(`/technologies/${messagingSkill.body.id}`).expect(204);

    const methodologySkill = await agent
      .post('/technologies')
      .send({ name: 'Scrum E2E', category: 'METODOLOGIAS' })
      .expect(201);
    expect(methodologySkill.body).toMatchObject({ category: 'METODOLOGIAS' });
    await agent.delete(`/technologies/${methodologySkill.body.id}`).expect(204);

    const testingSkill = await agent
      .post('/technologies')
      .send({ name: 'Vitest E2E', category: 'TESTES' })
      .expect(201);
    expect(testingSkill.body).toMatchObject({ category: 'TESTES' });
    await agent.delete(`/technologies/${testingSkill.body.id}`).expect(204);

    await agent.get('/technologies').expect(200);
  });

  it('denies writes without cookie', async () => {
    await request(app.getHttpServer())
      .post('/technologies')
      .send({ name: 'PHP' })
      .expect(401);
  });
});
