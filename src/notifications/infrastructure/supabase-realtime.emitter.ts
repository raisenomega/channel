/**
 * HUB by Raisen — Emitter Supabase Realtime para notificaciones.
 * Publica al canal tenant:{tenantId} via REST broadcast. C4 ≤75 lineas.
 */
import { err, ok } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { Notification } from "../domain/notification.entity.ts";
import type { NotificationEmitter } from "../application/notification-emitter.port.ts";

declare const process: { env: Record<string, string | undefined> };

function getEnv(n: string): string | undefined {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  return d?.env?.get ? d.env.get(n) : process.env[n];
}

export class SupabaseRealtimeEmitter implements NotificationEmitter {
  async emitir(notification: Notification, tenantId: string): Promise<Result<void, string>> {
    const url = getEnv("SUPABASE_URL");
    const apikey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !apikey) return err("config_incompleta");
    try {
      // Supabase Realtime Broadcast via REST: POST a /realtime/v1/postgres_changes (o broadcast)
      const channel = `tenant:${tenantId}`;
      const res = await fetch(`${url}/realtime/v1/api/broadcast`, {
        method: "POST",
        headers: { apikey, Authorization: `Bearer ${apikey}`, "content-type": "application/json" },
        body: JSON.stringify({ channel, data: { type: "notification", notification } }),
      });
      return res.ok ? ok(undefined) : err(`http_${res.status}`);
    } catch (e) { return err(String(e)); }
  }
}