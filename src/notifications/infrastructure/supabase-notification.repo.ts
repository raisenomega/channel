/**
 * HUB by Raisen — Repositorio Supabase de notificaciones.
 * CRUD via Supabase REST para notifications.
 * Preferencias viven en supabase-notification-pref.repo.ts.
 * C4 ≤75 lineas.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { Notification } from "../domain/notification.entity.ts";
import type { NotificationType } from "../domain/notification-type.vo.ts";
import type { NotificationRepository, NotificationQuery } from "../application/notification.repo.ts";
import { supabaseBase, supabaseHdrs } from "./supabase-rest.helper.ts";
import { SupabaseNotificationPrefRepo } from "./supabase-notification-pref.repo.ts";

interface NotificationRow {
  id: string; tenant_id: string; user_id: string; type: string; severity: string;
  title: string; body: string | null; payload: Record<string, unknown> | null;
  read_at: string | null; created_at: string;
}

function toEntity(r: NotificationRow): Notification {
  return {
    id: r.id, tenantId: r.tenant_id, userId: r.user_id, type: r.type as NotificationType,
    severity: r.severity as "info" | "warning" | "critical", title: r.title,
    ...(r.body ? { body: r.body } : {}),
    ...(r.payload ? { payload: r.payload } : {}),
    ...(r.read_at ? { readAt: r.read_at } : {}),
    createdAt: r.created_at,
  };
}

export class SupabaseNotificationRepo implements NotificationRepository {
  private prefRepo = new SupabaseNotificationPrefRepo();

  async guardar(n: Notification): Promise<Result<void, string>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      const r = await fetch(`${u}/notifications`, { method: "POST", headers: h, body: JSON.stringify({ id: n.id, tenant_id: n.tenantId, user_id: n.userId, type: n.type, severity: n.severity, title: n.title, body: n.body ?? null, payload: n.payload ?? null, created_at: n.createdAt }) });
      return r.ok ? ok(undefined) : err(`http_${r.status}`);
    } catch (e) { return err(String(e)); }
  }

  async listar(userId: string, q: NotificationQuery): Promise<Result<Notification[], string>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      let url = `${u}/notifications?select=*&user_id=eq.${encodeURIComponent(String(userId))}&order=created_at.desc&limit=${q.limit ?? 20}`;
      if (q.unread) url += "&read_at=is.null";
      if (q.since) url += `&created_at=gt.${encodeURIComponent(q.since)}`;
      const r = await fetch(url, { headers: h });
      if (!r.ok) return err(`http_${r.status}`);
      const rows = await r.json() as NotificationRow[];
      return ok(rows.map(toEntity));
    } catch (e) { return err(String(e)); }
  }

  async marcarLeida(id: string, userId: string): Promise<Result<void, string>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      const r = await fetch(`${u}/notifications?id=eq.${encodeURIComponent(String(id))}&user_id=eq.${encodeURIComponent(String(userId))}&read_at=is.null`, { method: "PATCH", headers: h, body: JSON.stringify({ read_at: new Date().toISOString() }) });
      return r.ok ? ok(undefined) : err(`http_${r.status}`);
    } catch (e) { return err(String(e)); }
  }

  async obtenerPreferencia(userId: string) { return this.prefRepo.obtenerPreferencia(userId); }
  async upsertPreferencia(pref: import("../domain/notification-preference.entity.ts").NotificationPreference) { return this.prefRepo.upsertPreferencia(pref); }
  async esTipoSilenciado(userId: string, type: NotificationType) { return this.prefRepo.esTipoSilenciado(userId, type); }
}