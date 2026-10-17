import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const tanstackSrc = fileURLToPath(new URL('./apps/tanstack/src', import.meta.url));
// Hotfix L: el router vive SOLO en apps/tanstack/node_modules. Sin este alias el
// test y el componente bajo prueba resuelven ids distintos y vi.mock no aplica
// (los tests de render de rutas no podrian existir).
const reactRouter = fileURLToPath(
  new URL('./apps/tanstack/node_modules/@tanstack/react-router/dist/esm/index.js', import.meta.url),
);
// react-query debe salir del root (misma instancia de React que los tests);
// la copia de apps/tanstack arrastra su propio react y rompe los hooks.
const reactQuery = fileURLToPath(
  new URL('./node_modules/@tanstack/react-query/build/legacy/index.js', import.meta.url),
);

export default defineConfig({
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  resolve: {
    alias: { '@': tanstackSrc, '@tanstack/react-router': reactRouter, '@tanstack/react-query': reactQuery },
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
