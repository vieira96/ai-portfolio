import { validateEnv } from './env.validation.js';

describe('validateEnv', () => {
  const valid = {
    PORT: '8000',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/portfolio',
    JWT_SECRET: 'a'.repeat(32),
    SEED_USER_NAME: 'Test User',
    SEED_USER_EMAIL: 'voce@example.com',
    SEED_USER_PASSWORD: 'password123',
    OLLAMA_URL: 'http://localhost:11434',
    OLLAMA_CHAT_MODEL: 'qwen2.5:7b',
    OLLAMA_TIMEOUT_MS: '60000',
    REDIS_URL: 'redis://localhost:6379',
    CORS_ORIGINS: 'http://localhost:3000',
  };

  it('accepts a complete valid config', () => {
    expect(() => validateEnv(valid)).not.toThrow();
  });

  it('applies defaults for PORT and NODE_ENV', () => {
    const { PORT: _port, ...withoutOptionals } = valid;

    const parsed = validateEnv(withoutOptionals);

    expect(parsed.PORT).toBe(8000);
    expect(parsed.NODE_ENV).toBe('development');
  });

  it('rejects a missing DATABASE_URL naming it', () => {
    const { DATABASE_URL: _databaseUrl, ...withoutDb } = valid;

    expect(() => validateEnv(withoutDb)).toThrow('DATABASE_URL');
  });

  it('rejects an invalid NODE_ENV', () => {
    expect(() => validateEnv({ ...valid, NODE_ENV: 'prod' })).toThrow(
      'NODE_ENV',
    );
  });

  it('rejects a short JWT_SECRET', () => {
    expect(() => validateEnv({ ...valid, JWT_SECRET: 'short' })).toThrow(
      'JWT_SECRET',
    );
  });

  it('rejects an invalid seed email', () => {
    expect(
      () => validateEnv({ ...valid, SEED_USER_EMAIL: 'not-an-email' }),
    ).toThrow('SEED_USER_EMAIL');
  });

  it('rejects a short seed password', () => {
    expect(
      () => validateEnv({ ...valid, SEED_USER_PASSWORD: 'short' }),
    ).toThrow('SEED_USER_PASSWORD');
  });

  it('rejects a malformed optional profile URL', () => {
    expect(
      () =>
        validateEnv({ ...valid, SEED_USER_GITHUB_URL: 'not-a-url' }),
    ).toThrow('SEED_USER_GITHUB_URL');
  });

  it('rejects a missing OLLAMA_URL naming it', () => {
    const { OLLAMA_URL: _ollamaUrl, ...withoutOllama } = valid;

    expect(() => validateEnv(withoutOllama)).toThrow('OLLAMA_URL');
  });

  it('rejects a missing OLLAMA_CHAT_MODEL naming it', () => {
    const { OLLAMA_CHAT_MODEL: _ollamaModel, ...withoutModel } = valid;

    expect(() => validateEnv(withoutModel)).toThrow('OLLAMA_CHAT_MODEL');
  });

  it('rejects a malformed OLLAMA_URL', () => {
    expect(() => validateEnv({ ...valid, OLLAMA_URL: 'not-a-url' })).toThrow(
      'OLLAMA_URL',
    );
  });

  it('applies the default OLLAMA_TIMEOUT_MS', () => {
    const { OLLAMA_TIMEOUT_MS: _timeout, ...withoutTimeout } = valid;

    expect(validateEnv(withoutTimeout).OLLAMA_TIMEOUT_MS).toBe(60000);
  });

  it('rejects a non-positive OLLAMA_TIMEOUT_MS', () => {
    expect(
      () => validateEnv({ ...valid, OLLAMA_TIMEOUT_MS: '0' }),
    ).toThrow('OLLAMA_TIMEOUT_MS');
  });

  it('rejects a missing REDIS_URL naming it', () => {
    const { REDIS_URL: _redisUrl, ...withoutRedis } = valid;

    expect(() => validateEnv(withoutRedis)).toThrow('REDIS_URL');
  });

  it('rejects a malformed REDIS_URL', () => {
    expect(() => validateEnv({ ...valid, REDIS_URL: 'not-a-url' })).toThrow(
      'REDIS_URL',
    );
  });

  it('parses a single CORS origin', () => {
    expect(validateEnv(valid).CORS_ORIGINS).toEqual([
      'http://localhost:3000',
    ]);
  });

  it('parses multiple origins trimming spaces and dropping empties', () => {
    const parsed = validateEnv({
      ...valid,
      CORS_ORIGINS: ' https://a.com , ,https://b.com ',
    });

    expect(parsed.CORS_ORIGINS).toEqual(['https://a.com', 'https://b.com']);
  });

  it('rejects a missing CORS_ORIGINS naming it', () => {
    const { CORS_ORIGINS: _cors, ...withoutCors } = valid;

    expect(() => validateEnv(withoutCors)).toThrow('CORS_ORIGINS');
  });

  it('rejects a malformed CORS origin naming it', () => {
    expect(
      () => validateEnv({ ...valid, CORS_ORIGINS: 'http://ok.com,not-a-url' }),
    ).toThrow('CORS_ORIGINS');
  });

  it('rejects a CORS_ORIGINS with no origin', () => {
    expect(() => validateEnv({ ...valid, CORS_ORIGINS: ' , ' })).toThrow(
      'CORS_ORIGINS',
    );
  });

  it('accepts a missing GROQ_API_KEY (Groq off)', () => {
    expect(validateEnv(valid).GROQ_API_KEY).toBeUndefined();
  });

  it('applies defaults for GROQ_MODEL and GROQ_TIMEOUT_MS', () => {
    const parsed = validateEnv(valid);

    expect(parsed.GROQ_MODEL).toBe('openai/gpt-oss-120b');
    expect(parsed.GROQ_TIMEOUT_MS).toBe(60000);
  });

  it('rejects a non-positive GROQ_TIMEOUT_MS', () => {
    expect(() => validateEnv({ ...valid, GROQ_TIMEOUT_MS: '0' })).toThrow(
      'GROQ_TIMEOUT_MS',
    );
  });

  it('accepts a missing GEMINI_API_KEY', () => {
    expect(validateEnv(valid).GEMINI_API_KEY).toBeUndefined();
  });

  it('applies defaults for GEMINI_MODEL and GEMINI_TIMEOUT_MS', () => {
    const parsed = validateEnv(valid);

    expect(parsed.GEMINI_MODEL).toBe('gemini-3.1-flash-lite');
    expect(parsed.GEMINI_TIMEOUT_MS).toBe(60000);
  });

  it('accepts a configured GEMINI_API_KEY', () => {
    expect(
      validateEnv({ ...valid, GEMINI_API_KEY: 'gemini-test-key' }).GEMINI_API_KEY,
    ).toBe('gemini-test-key');
  });

  it('rejects a non-positive GEMINI_TIMEOUT_MS', () => {
    expect(
      () => validateEnv({ ...valid, GEMINI_TIMEOUT_MS: '0' }),
    ).toThrow('GEMINI_TIMEOUT_MS');
  });
});
