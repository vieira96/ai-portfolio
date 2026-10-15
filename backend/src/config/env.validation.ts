import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must have at least 32 characters'),

  OLLAMA_URL: z.url('OLLAMA_URL must be a valid URL'),
  OLLAMA_CHAT_MODEL: z.string().min(1, 'OLLAMA_CHAT_MODEL is required'),
  OLLAMA_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),

  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().min(1).default('openai/gpt-oss-120b'),
  GROQ_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().min(1).default('gemini-3.1-flash-lite'),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),

  REDIS_URL: z.url('REDIS_URL must be a valid URL'),

  CORS_ORIGINS: z
    .string()
    .min(1, 'CORS_ORIGINS is required')
    .transform((raw, ctx) => {
      const origins = raw
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
      for (const origin of origins) {
        if (!z.url().safeParse(origin).success) {
          ctx.addIssue({
            code: 'custom',
            path: ['CORS_ORIGINS'],
            message: `CORS_ORIGINS has an invalid URL: ${origin}`,
          });
          return z.NEVER;
        }
      }
      if (origins.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['CORS_ORIGINS'],
          message: 'CORS_ORIGINS must have at least one origin',
        });
        return z.NEVER;
      }
      return origins;
    }),

  SEED_USER_NAME: z.string().min(1, 'SEED_USER_NAME is required'),
  SEED_USER_EMAIL: z.email('SEED_USER_EMAIL must be a valid email'),
  SEED_USER_PASSWORD: z.string().min(8, 'SEED_USER_PASSWORD must have at least 8 characters'),

  SEED_USER_HEADLINE: z.string().optional(),
  SEED_USER_BIO: z.string().optional(),
  SEED_USER_LOCATION: z.string().optional(),
  SEED_USER_GITHUB_URL: z.url('SEED_USER_GITHUB_URL must be a valid URL').optional(),
  SEED_USER_LINKEDIN_URL: z.url('SEED_USER_LINKEDIN_URL must be a valid URL').optional(),
  SEED_USER_PORTFOLIO_URL: z.url('SEED_USER_PORTFOLIO_URL must be a valid URL').optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment variables: ${details}`);
  }

  return parsed.data;
}
