import { defineConfig } from 'vitest/config';
import { baseConfig } from './vitest.config.base.js';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['**/*.e2e-spec.ts'],
    // As suítes criam containers e alteram process.env globalmente; executar
    // arquivos em paralelo causa interferência entre apps, Redis e providers.
    fileParallelism: false,
    testTimeout: 120000,
    hookTimeout: 180000,
    teardownTimeout: 60000,
  },
});
