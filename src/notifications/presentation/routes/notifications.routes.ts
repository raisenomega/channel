/**
 * HUB by Raisen — Rutas HTTP de notificaciones.
 * GET /notifications, POST /notifications/:id/read, PATCH /notifications/preferences.
 * Autenticacion via JWT (parsearJwtClaims). tenantId y userId SOLO del JWT.
 * C4 ≤75 lineas.
 */
import type { RouteDefinition, RequestContext } from "../../../server/server-types.ts";
import { parsearJwtClaims } from "../../../server/jwt-verify.ts";
import type { NotificationType } from "../../domain/notification-type.vo.ts";
import { GetNotificationsHandler } from "../../application/get-notifications.handler.ts";
import { MarkReadHandler } from "../../application/mark-read.handler.ts";
import { UpdatePreferencesHandler } from "../../application/update-preferences.handler.ts";

export interface NotificationsHandlers {
  readonly getHandler: GetNotificationsHandler;
  readonly markReadHandler: MarkReadHandler;
  readonly updatePrefsHandler: UpdatePreferencesHandler;
}

function authHeader(ctx: RequestContext): string | null {
  const raw = ctx.headers["authorization"] ?? ctx.headers["Authorization"] ?? null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

export function rutaGetNotifications(h: NotificationsHandlers): RouteDefinition {
  return {
    method: "GET", path: "/notifications",
    handler: async (ctx) => {
      const claims = await parsearJwtClaims(authHeader(ctx));
      if (!claims.ok) return { ok: false, error: claims.error };
      const q = ctx.path.includes("?") ? new URLSearchParams(ctx.path.split("?")[1] ?? "") : new URLSearchParams();
      const result = await h.getHandler.ejecutar({
        userId: claims.value.userId,
        ...(q.get("unread") === "true" ? { unread: true } : {}),
        ...(q.get("since") ? { since: q.get("since")! } : {}),
        limit: q.get("limit") ? parseInt(q.get("limit")!, 10) : 20,
      });
      return result.ok ? { ok: true, data: result.value } : { ok: false, error: result.error };
    },
  };
}

export function rutaMarkRead(h: NotificationsHandlers): RouteDefinition {
  return {
    method: "POST", path: "/notifications/:id/read",
    handler: async (ctx) => {
      const claims = await parsearJwtClaims(authHeader(ctx));
      if (!claims.ok) return { ok: false, error: claims.error };
      const id = ctx.path.split("/")[2] ?? "";
      const result = await h.markReadHandler.ejecutar({ id, userId: claims.value.userId });
      return result.ok ? { ok: true } : { ok: false, error: result.error };
    },
  };
}

export function rutaUpdatePreferences(h: NotificationsHandlers): RouteDefinition {
  return {
    method: "PATCH", path: "/notifications/preferences",
    handler: async (ctx) => {
      const claims = await parsearJwtClaims(authHeader(ctx));
      if (!claims.ok) return { ok: false, error: claims.error };
      const b = ctx.body as Record<string, unknown> | null ?? {};
      const result = await h.updatePrefsHandler.ejecutar({
        userId: claims.value.userId,
        tenantId: claims.value.tenantId,
        ...(b["in_app_enabled"] !== undefined ? { inAppEnabled: b["in_app_enabled"] as boolean } : {}),
        ...(b["email_enabled"] !== undefined ? { emailEnabled: b["email_enabled"] as boolean } : {}),
        ...(b["push_enabled"] !== undefined ? { pushEnabled: b["push_enabled"] as boolean } : {}),
        ...(b["muted_types"] !== undefined ? { mutedTypes: b["muted_types"] as NotificationType[] } : {}),
      });
      return result.ok ? { ok: true } : { ok: false, error: result.error };
    },
  };
}