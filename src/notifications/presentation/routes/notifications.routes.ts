/**
 * HUB by Raisen — Rutas HTTP de notificaciones.
 * GET /notifications, POST /notifications/:id/read, PATCH /notifications/preferences.
 * C4 ≤75 lineas.
 */
import type { RouteDefinition } from "../../../server/server-types.ts";
import { obj } from "../../../server/server-helpers.ts";
import { GetNotificationsHandler } from "../../application/get-notifications.handler.ts";
import { MarkReadHandler } from "../../application/mark-read.handler.ts";
import { UpdatePreferencesHandler } from "../../application/update-preferences.handler.ts";
import { SupabaseNotificationRepo } from "../../infrastructure/supabase-notification.repo.ts";

const repo = new SupabaseNotificationRepo();
const getHandler = new GetNotificationsHandler(repo);
const markHandler = new MarkReadHandler(repo);
const prefHandler = new UpdatePreferencesHandler(repo);

function jwtUserId(ctx: { jwt: string | null }): string {
  // Extraer sub del JWT (placeholder: en produccion verificar firma)
  // Autenticacion completa es responsabilidad del server middleware
  return ctx.jwt ?? "";
}

export function rutaGetNotifications(): RouteDefinition {
  return {
    method: "GET", path: "/notifications",
    handler: async (ctx) => {
      const userId = jwtUserId(ctx);
      if (!userId) return { ok: false, error: { kind: "no_autenticado" } };
      const q = ctx.path.includes("?") ? new URLSearchParams(ctx.path.split("?")[1] ?? "") : new URLSearchParams();
      const sinceRaw = q.get("since");
      const unreadRaw = q.get("unread");
      const limitRaw = q.get("limit");
      const cmd: Record<string, unknown> = { userId };
      if (unreadRaw === "true") cmd.unread = true;
      if (sinceRaw) cmd.since = sinceRaw;
      cmd.limit = limitRaw ? parseInt(limitRaw, 10) : 20;
      const result = await getHandler.ejecutar(cmd as unknown as Parameters<typeof getHandler.ejecutar>[0]);
      return result.ok ? { ok: true, data: result.value } : { ok: false, error: result.error };
    },
  };
}

export function rutaMarkRead(): RouteDefinition {
  return {
    method: "POST", path: "/notifications/:id/read",
    handler: async (ctx) => {
      const userId = jwtUserId(ctx);
      if (!userId) return { ok: false, error: { kind: "no_autenticado" } };
      const id = ctx.path.split("/")[2] ?? "";
      const result = await markHandler.ejecutar({ id, userId });
      return result.ok ? { ok: true } : { ok: false, error: result.error };
    },
  };
}

export function rutaUpdatePreferences(): RouteDefinition {
  return {
    method: "PATCH", path: "/notifications/preferences",
    handler: async (ctx) => {
      const userId = jwtUserId(ctx);
      if (!userId) return { ok: false, error: { kind: "no_autenticado" } };
      const b = obj(ctx.body);
      const cmdPref: Record<string, unknown> = { userId, tenantId: String(b["tenantId"] ?? "") };
      if (b["in_app_enabled"] !== undefined) cmdPref.inAppEnabled = b["in_app_enabled"];
      if (b["email_enabled"] !== undefined) cmdPref.emailEnabled = b["email_enabled"];
      if (b["push_enabled"] !== undefined) cmdPref.pushEnabled = b["push_enabled"];
      if (b["muted_types"] !== undefined) cmdPref.mutedTypes = b["muted_types"];
      const result = await prefHandler.ejecutar(cmdPref as unknown as Parameters<typeof prefHandler.ejecutar>[0]);
      return result.ok ? { ok: true } : { ok: false, error: result.error };
    },
  };
}