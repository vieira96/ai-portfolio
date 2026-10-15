import { defineConfig } from 'vitest/config';
import { baseConfig } from './vitest.config.base.js';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['src/**/*.integration.spec.ts'],
    testTimeout: 120000,
    hookTimeout: 180000,
    teardownTimeout: 60000,
  },
});
