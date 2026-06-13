import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.integration.test.ts',
      'tests/e2e/**/*.e2e.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['tests/surface/**/*.ts'],
      exclude: ['tests/surface/**/*.test.ts'],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
