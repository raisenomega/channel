/**
 * HUB by Raisen — Repositorio Supabase de preferencias de notificacion.
 * CRUD via Supabase REST para notification_preferences.
 * C4 ≤75 lineas.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { NotificationPreference } from "../domain/notification-preference.entity.ts";
import type { NotificationType } from "../domain/notification-type.vo.ts";
import { supabaseBase, supabaseHdrs } from "./supabase-rest.helper.ts";

interface PrefRow {
  id: string; tenant_id: string; user_id: string; in_app_enabled: boolean;
  email_enabled: boolean; push_enabled: boolean; muted_types: string[]; updated_at: string;
}

type PrefInput = Pick<NotificationPreference, "userId" | "tenantId" | "inAppEnabled" | "emailEnabled" | "pushEnabled" | "mutedTypes">;

export class SupabaseNotificationPrefRepo {
  async obtenerPreferencia(userId: string): Promise<Result<NotificationPreference | null, string>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      const r = await fetch(`${u}/notification_preferences?select=*&user_id=eq.${encodeURIComponent(String(userId))}&limit=1`, { headers: h });
      if (!r.ok) return err(`http_${r.status}`);
      const rows = await r.json() as PrefRow[];
      if (!rows || rows.length === 0) return ok(null);
      const p = rows[0]!;
      return ok({ id: p.id, tenantId: p.tenant_id, userId: p.user_id, inAppEnabled: p.in_app_enabled, emailEnabled: p.email_enabled, pushEnabled: p.push_enabled, mutedTypes: p.muted_types as NotificationType[], updatedAt: p.updated_at });
    } catch (e) { return err(String(e)); }
  }

  async upsertPreferencia(pref: PrefInput): Promise<Result<void, string>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      const body = { tenant_id: pref.tenantId, in_app_enabled: pref.inAppEnabled, email_enabled: pref.emailEnabled, push_enabled: pref.pushEnabled, muted_types: pref.mutedTypes };
      const r = await fetch(`${u}/notification_preferences?user_id=eq.${encodeURIComponent(String(pref.userId))}`, { method: "PATCH", headers: h, body: JSON.stringify(body) });
      if (r.status === 404) {
        const c = await fetch(`${u}/notification_preferences`, { method: "POST", headers: h, body: JSON.stringify({ ...body, user_id: pref.userId }) });
        return c.ok ? ok(undefined) : err(`http_${c.status}`);
      }
      return r.ok ? ok(undefined) : err(`http_${r.status}`);
    } catch (e) { return err(String(e)); }
  }

  async esTipoSilenciado(userId: string, type: NotificationType): Promise<Result<boolean, string>> {
    const pref = await this.obtenerPreferencia(userId);
    if (!pref.ok) return err(pref.error);
    return ok(pref.value ? pref.value.mutedTypes.includes(type) : false);
  }
}