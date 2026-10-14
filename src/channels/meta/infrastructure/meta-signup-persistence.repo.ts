/**
 * HUB by Raisen — Repositorio de embedded_signups en Supabase REST.
 * Implementa init (crear) y buscarPorMetaId para callback.
 * C4 ≤75 lineas.
 */
import { ok, err } from "../../../shared/domain/result.ts";
import type { Result } from "../../../shared/domain/result.ts";

declare const process: { env: Record<string, string | undefined> };

function getEnv(n: string): string | undefined {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  return d?.env?.get ? d.env.get(n) : process.env[n];
}

function base(): string | null { return getEnv("SUPABASE_URL") ?? null; }
function hdrs(): Record<string, string> | null {
  const k = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  return k ? { apikey: k, Authorization: `Bearer ${k}`, "content-type": "application/json" } : null;
}

export interface SignupRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly status: string;
}

export class MetaSignupPersistenceRepo {
  async crearSignup(tenantId: string, signupId: string, metaWebhookId: string): Promise<Result<void, string>> {
    const u = base(); const h = hdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      const r = await fetch(`${u}/embedded_signups`, { method: "POST", headers: h, body: JSON.stringify({ id: signupId, tenant_id: tenantId, meta_webhook_id: metaWebhookId, status: "CREATED" }) });
      return r.ok ? ok(undefined) : err(`http_${r.status}`);
    } catch (e) { return err(String(e)); }
  }

  async buscarPorId(signupId: string): Promise<Result<SignupRow | null, string>> {
    const u = base(); const h = hdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      const r = await fetch(`${u}/embedded_signups?select=id,tenant_id,status&id=eq.${encodeURIComponent(String(signupId))}&limit=1`, { headers: h });
      if (!r.ok) return err(`http_${r.status}`);
      const rows = await r.json() as SignupRow[];
      return ok(rows && rows.length > 0 ? rows[0]! : null);
    } catch (e) { return err(String(e)); }
  }

  async actualizar(signupId: string, data: Record<string, unknown>): Promise<Result<void, string>> {
    const u = base(); const h = hdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      const r = await fetch(`${u}/embedded_signups?id=eq.${encodeURIComponent(String(signupId))}`, { method: "PATCH", headers: h, body: JSON.stringify(data) });
      return r.ok ? ok(undefined) : err(`http_${r.status}`);
    } catch (e) { return err(String(e)); }
  }
}