import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const tanstackSrc = fileURLToPath(new URL('./apps/tanstack/src', import.meta.url));

export default defineConfig({
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  resolve: {
    alias: { '@': tanstackSrc },
    // apps/tanstack tiene su propio node_modules: forzar UNA sola instancia de React.
    dedupe: ['react', 'react-dom'],
  },
  test: {
    globals: true,
    environment: 'node', // default sigue siendo node
    environmentMatchGlobs: [
      ['tests/unit/components/dashboard/**', 'jsdom'], // UI tests corren en jsdom
      ['tests/unit/hooks/**', 'jsdom'], // hooks tambien
      ['tests/unit/frontend/**', 'jsdom'], // lib del frontend (api-client, session) Hotfix G
    ],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
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
