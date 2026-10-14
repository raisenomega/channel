import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    deps: {
      // Evitar que esbuild spawn para transformar; usar tsn transform nativo
      transformer: 'raw',
    },
    server: {
      deps: {
        fallbackCJS: true,
      },
    },
  },
});