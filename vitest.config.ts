import { defineConfig } from 'vitest/config';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const tanstackSrc = fileURLToPath(new URL('./apps/tanstack/src', import.meta.url));

/**
 * Hotfix L-SEV-1 (leccion K-SEV-1): los tests del root solo pueden depender de
 * lo que instala el `pnpm install` del ROOT. react-router / react-query estan
 * en root devDependencies; el alias fuerza UN solo id de modulo para el test y
 * para el componente bajo prueba (apps/tanstack/src resolveria su propia copia
 * cuando esta existe -> vi.mock no aplicaria y habria 2 instancias de React).
 * Prioridad root; apps/tanstack solo como respaldo local. Si ninguno existe no
 * se aliasa: que Vite falle con su propio mensaje en vez de un path fantasma.
 */
function paquete(...candidatos: string[]): string | null {
  for (const c of candidatos) {
    const p = fileURLToPath(new URL(c, import.meta.url));
    if (existsSync(p)) return p;
  }
  return null;
}

const alias: Record<string, string> = { '@': tanstackSrc };
const reactRouter = paquete(
  './node_modules/@tanstack/react-router/dist/esm/index.js',
  './apps/tanstack/node_modules/@tanstack/react-router/dist/esm/index.js',
);
if (reactRouter) alias['@tanstack/react-router'] = reactRouter;
const reactQuery = paquete(
  './node_modules/@tanstack/react-query/build/legacy/index.js',
  './apps/tanstack/node_modules/@tanstack/react-query/build/legacy/index.js',
);
if (reactQuery) alias['@tanstack/react-query'] = reactQuery;

export default defineConfig({
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  resolve: {
    alias,
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
