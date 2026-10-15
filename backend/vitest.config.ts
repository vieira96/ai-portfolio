import { defineConfig } from 'vitest/config';
import { baseConfig } from './vitest.config.base.js';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '**/*.integration.spec.ts', '**/*.e2e-spec.ts'],
  },
});
