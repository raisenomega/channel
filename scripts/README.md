# HUB — Build Pipeline (Slide BUILD-STEP)

## Comandos

| Comando | Uso |
|---|---|
| `pnpm dev` | Desarrollo local con hot reload (tsx). Arranca src/ directo. |
| `pnpm build` | Compila TypeScript `src/` → `dist/*.js`. Requerido para produccion. |
| `pnpm start` | Corre `dist/server/hub.server.js`. Requiere `pnpm build` previo. |
| `pnpm check:server-smoke` | Verifica que el server arranca sin crashear al menos 3s. |

## Por que no --experimental-strip-types

Node `--experimental-strip-types` elimina tipos pero NO soporta **parameter properties** (`constructor(private readonly x: T) {}`), que es el patron DDD estandar usado en 47 archivos del backend.

`tsc --project tsconfig.build.json` con `rewriteRelativeImportExtensions: true` (TS 5.7+) desugara parameter properties a `this.x = x` y reescribe imports `.ts` → `.js`.

## Railway

Despues del merge:
1. Verificar Build Command: `pnpm install && pnpm build`
2. Verificar Start Command: `pnpm start`
3. Verificar que `channel` service queda RUNNING (verde)