/**
 * HUB by Raisen — GET /health: SHA del commit desplegado (RAILWAY_GIT_COMMIT_SHA) + hora.
 * Sirve para verificar QUE commit corre de verdad el backend (sin adivinar por el deploy id de Railway).
 */
import type { RouteDefinition } from "./server-types.ts";
import { getEnv } from "../shared/infrastructure/supabase-rest.helper.ts";

// PUBLIC: health check sin datos de tenant (solo SHA del deploy + hora) para verificar que corre.
export function rutaHealth(): RouteDefinition {
  return {
    method: "GET",
    path: "/health",
    handler: () => Promise.resolve({ ok: true, sha: getEnv("RAILWAY_GIT_COMMIT_SHA") ?? "unknown", at: new Date().toISOString() }),
  };
}
