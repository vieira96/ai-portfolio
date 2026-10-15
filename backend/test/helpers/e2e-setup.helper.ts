import { execSync } from 'node:child_process';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { Pool } from 'pg';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { GlobalExceptionFilter } from '../../src/common/filters/http-exception.filter.js';
import { visitorCookieMiddleware } from '../../src/modules/chat/middlewares/visitor-cookie.middleware.js';

export interface TestAppContext {
  app: INestApplication;
  container: StartedTestContainer;
  originalEnvironment: Record<string, string | undefined>;
}

export interface SeedCredentials {
  name: string;
  email: string;
  password: string;
}

const MANAGED_ENV_KEYS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SEED_USER_NAME',
  'SEED_USER_EMAIL',
  'SEED_USER_PASSWORD',
  'OLLAMA_URL',
  'OLLAMA_CHAT_MODEL',
  'GROQ_API_KEY',
  'GROQ_MODEL',
  'GROQ_TIMEOUT_MS',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'GEMINI_TIMEOUT_MS',
  'CORS_ORIGINS',
  'REDIS_URL',
] as const;

// 32 = mínimo exigido pelo schema do JWT_SECRET no validateEnv.
const TEST_JWT_SECRET = 'e'.repeat(32);

// Valores de mentira só para o validateEnv passar no boot do app de teste:
// nenhuma chamada real ao Ollama acontece na suíte (HTTP é stubado).
const TEST_OLLAMA_URL = 'http://localhost:11434';
const TEST_OLLAMA_CHAT_MODEL = 'qwen2.5:7b';
const TEST_REDIS_URL = 'redis://localhost:6379';

export async function startPostgresContainer(): Promise<{
  container: StartedTestContainer;
  url: string;
}> {
  const container = await new GenericContainer(
    'postgres:16',
  )
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'test',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(
      Wait.forLogMessage('database system is ready to accept connections'),
    )
    .start();

  const host = container.getHost();
  const port = container.getMappedPort(5432);
  return {
    container,
    url: `postgresql://test:test@${host}:${port}/test?schema=public`,
  };
}

export async function prepareDatabase(url: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 10; attempt++) {
    const pool = new Pool({ connectionString: url });
    try {
      await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
      await pool.end();
      return;
    } catch (error) {
      lastError = error;
      await pool.end().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  throw lastError;
}

export function applyMigrations(url: string): void {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });
}

export async function setupTestApp(
  seed: SeedCredentials,
): Promise<TestAppContext> {
  const { container, url } = await startPostgresContainer();

  try {
    await prepareDatabase(url);
    applyMigrations(url);

    const originalEnvironment: Record<string, string | undefined> = {};
    for (const key of MANAGED_ENV_KEYS) {
      originalEnvironment[key] = process.env[key];
    }

    process.env.DATABASE_URL = url;
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.SEED_USER_NAME = seed.name;
    process.env.SEED_USER_EMAIL = seed.email;
    process.env.SEED_USER_PASSWORD = seed.password;
    process.env.OLLAMA_URL = TEST_OLLAMA_URL;
    process.env.OLLAMA_CHAT_MODEL = TEST_OLLAMA_CHAT_MODEL;
    // Groq sempre desligado na suíte (hermética): key vazia vence o .env real,
    // que o ConfigModule leria do arquivo. Sem isso, máquina com key no .env
    // testaria o provedor errado.
    process.env.GROQ_API_KEY = '';
    process.env.GROQ_MODEL = 'openai/gpt-oss-120b';
    process.env.GROQ_TIMEOUT_MS = '60000';
    // Gemini também fica desligado na suíte para manter o provider testado
    // determinístico, independentemente das chaves do .env local.
    process.env.GEMINI_API_KEY = '';
    process.env.GEMINI_MODEL = 'gemini-3.1-flash-lite';
    process.env.GEMINI_TIMEOUT_MS = '60000';
    // CORS_ORIGINS é obrigatória no boot: dummy como as demais, senão o CI
    // (sem .env) aborta no validateEnv antes do primeiro teste.
    process.env.CORS_ORIGINS = 'http://localhost:3000';
    // REDIS_URL: respeita valor pré-definido (ex: Redis efêmero do
    // chat.e2e-spec); dummy só para o Zod passar no boot das demais suítes.
    if (!process.env.REDIS_URL) {
      process.env.REDIS_URL = TEST_REDIS_URL;
    }

    execSync('npx prisma db seed', {
      env: { ...process.env },
      stdio: 'pipe',
    });

    // Dynamic import AFTER test env is set: AppModule's
    // ConfigModule.forRoot({ validate }) runs at import time, so a static
    // import would validate before these variables exist (clean CI has no .env).
    const { AppModule } = await import('../../src/app.module.js');

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string, defaultValue?: string) =>
          process.env[key] ?? defaultValue,
        getOrThrow: (key: string) => {
          const value = process.env[key];
          if (value === undefined) {
            throw new Error(`Missing environment variable: ${key}`);
          }
          return value;
        },
      })
      .compile();

    const app = module.createNestApplication();
    app.use(cookieParser());
    app.use(visitorCookieMiddleware);
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    return { app, container, originalEnvironment };
  } catch (error) {
    await container.stop();
    throw error;
  }
}

export async function teardownTestApp(context: {
  app?: INestApplication;
  container?: StartedTestContainer;
  originalEnvironment?: Record<string, string | undefined>;
} | undefined): Promise<void> {
  if (!context) return;

  await context.app?.close();
  await context.container?.stop();

  for (const [key, value] of Object.entries(
    context.originalEnvironment ?? {},
  )) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
