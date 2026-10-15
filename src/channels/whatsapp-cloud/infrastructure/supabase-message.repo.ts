/**
 * HUB by Raisen — Implementacion Supabase del repositorio de mensajes WhatsApp.
 * CRUD via Supabase REST para whatsapp_messages.
 * C4 ≤75 lineas.
 */
import { ok, err } from "../../../shared/domain/result.ts";
import type { Result } from "../../../shared/domain/result.ts";
import type { WhatsAppMessage } from "../domain/message.entity.ts";
import type { MessagePersistenceRepo } from "../application/message-persistence.repo.ts";

declare const process: { env: Record<string, string | undefined> };

function getEnv(n: string): string | undefined {
  const d = (globalThis as Record<string, unknown>)["Deno"]as { env?: { get?(k: string): string | undefined } } | undefined;
  return d?.env?.get? d.env.get(n) : process.env[n];
}

function base(): string | null { return getEnv("SUPABASE_URL") ?? null; }
function hdrs(): Record<string, string> | null {
  const k = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  return k ? { apikey: k, Authorization: `Bearer ${k}`, "content-type": "application/json" } : null;
}

export class SupabaseMessageRepo implements MessagePersistenceRepo {
  async guardar(msg: WhatsAppMessage): Promise<Result<void, string>> {
    const u = base(); const h = hdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      const r = await fetch(`${u}/whatsapp_messages`, {
        method: "POST", headers: h,
        body: JSON.stringify({
          id: msg.id, tenant_id: msg.tenantId, wamid: msg.wamid, phone_number_id: msg.phoneNumberId,
          direction: msg.direction, from_phone: msg.fromPhone, to_phone: msg.toPhone,
          content_type: msg.contentType, content_body: msg.contentBody, status: msg.status,
          sent_at: msg.sentAt, delivered_at: msg.deliveredAt, read_at: msg.readAt, created_at: msg.createdAt,
        }),
      });
      return r.ok ? ok(undefined) : err(`http_${r.status}`);
    } catch (e) { return err(String(e)); }
  }

  async buscarPorWamid(wamid: string): Promise<Result<WhatsAppMessage | null, string>> {
    const u = base(); const h = hdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      const r = await fetch(`${u}/whatsapp_messages?select=*&wamid=eq.${encodeURIComponent(String(wamid))}&limit=1`, { headers: h });
      if (!r.ok) return err(`http_${r.status}`);
      const rows = await r.json()as WhatsAppMessage[];
      return ok(rows && rows.length > 0 ? rows[0]! : null);
    } catch (e) { return err(String(e)); }
  }

  async actualizarStatus(wamid: string, status: string, extra?: Record<string, string>): Promise<Result<void, string>> {
    const u = base(); const h = hdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      const body: Record<string, unknown> = { status };
      if (extra?.sentAt) body.sent_at = extra.sentAt;
      if (extra?.deliveredAt) body.delivered_at = extra.deliveredAt;
      if (extra?.readAt) body.read_at = extra.readAt;
      const r = await fetch(`${u}/whatsapp_messages?wamid=eq.${encodeURIComponent(String(wamid))}`, { method: "PATCH", headers: h, body: JSON.stringify(body) });
      return r.ok ? ok(undefined) : err(`http_${r.status}`);
    } catch (e) { return err(String(e)); }
  }
}