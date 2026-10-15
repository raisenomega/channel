/**
 * HUB by Raisen — Lookups de embedded_signups para adapter WhatsApp.
 * buscarPorPhoneNumberId (inbound webhook) y buscarPorTenant (outbound send).
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

export interface SignupLookupRow {
  readonly id: string;
  readonly tenant_id: string;
  readonly status: string;
}

export class MetaSignupLookupRepo {
  async buscarPorPhoneNumberId(phoneNumberId: string): Promise<Result<SignupLookupRow | null, string>> {
    const u = base(); const h = hdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      const r = await fetch(`${u}/embedded_signups?select=id,tenant_id,status&phone_number_id=eq.${encodeURIComponent(String(phoneNumberId))}&status=eq.COMPLETED&limit=1`, { headers: h });
      if (!r.ok) return err(`http_${r.status}`);
      const rows = await r.json() as SignupLookupRow[];
      return ok(rows && rows.length > 0 ? rows[0]! : null);
    } catch (e) { return err(String(e)); }
  }

  async buscarPorTenant(tenantId: string): Promise<Result<SignupLookupRow | null, string>> {
    const u = base(); const h = hdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      const r = await fetch(`${u}/embedded_signups?select=id,tenant_id,status&tenant_id=eq.${encodeURIComponent(String(tenantId))}&status=eq.COMPLETED&limit=1`, { headers: h });
      if (!r.ok) return err(`http_${r.status}`);
      const rows = await r.json() as SignupLookupRow[];
      return ok(rows && rows.length > 0 ? rows[0]! : null);
    } catch (e) { return err(String(e)); }
  }
}