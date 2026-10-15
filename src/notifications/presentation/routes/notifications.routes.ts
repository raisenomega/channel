/**
 * HUB by Raisen — Rutas HTTP de notificaciones (DESHABILITADAS por seguridad).
 *
 * TODO (Sprint 2): Rutas deshabilitadas hasta implementar middleware JWT.
 * - NEW-CRIT-S3-A: jwtUserId() devolvia el JWT crudo como userId (backdoor auth).
 * - NEW-CRIT-S3-B: tenantId venia del body (atacable).
 * - Fix pendiente: src/server/jwt-verify.ts con jose + parsearJwtClaims().
 *
 * El BC notifications es funcional SIN estas rutas: los handlers de Slice 1/2
 * inyectan EmitNotificationHandler/NotificationEmitter directamente.
 *
 * NO registrar estas rutas en server-routes-registry.ts hasta que exista
 * verificación JWT. Este archivo es solo referencia para la implementación.
 */
import type { RouteDefinition } from "../../../server/server-types.ts";

// Rutas deshabilitadas. Re-implementar cuando exista jwt-verify.ts (Sprint 2).
export function rutaGetNotifications(): RouteDefinition {
  return { method: "GET", path: "/notifications", handler: async () => ({ ok: false, error: { kind: "no_autenticado" } }) };
}

export function rutaMarkRead(): RouteDefinition {
  return { method: "POST", path: "/notifications/:id/read", handler: async () => ({ ok: false, error: { kind: "no_autenticado" } }) };
}

export function rutaUpdatePreferences(): RouteDefinition {
  return { method: "PATCH", path: "/notifications/preferences", handler: async () => ({ ok: false, error: { kind: "no_autenticado" } }) };
}