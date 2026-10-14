/**
 * HUB by Raisen — Repositorio de state CSRF para Embedded Signup Meta.
 * Supabase REST. State single-use: DELETE despues de verificar.
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

export interface StateData {
  readonly signupId: string;
  readonly tenantId: string;
}

export class MetaSignupStateRepo {
  async guardarState(tenantId: string, state: string, signupId: string, expiresAt: string): Promise<Result<void, string>> {
    const u = base(); const h = hdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      const r = await fetch(`${u}/signup_state_tokens`, { method: "POST", headers: h, body: JSON.stringify({ tenant_id: tenantId, state, signup_id: signupId, expires_at: expiresAt }) });
      return r.ok ? ok(undefined) : err(`http_${r.status}`);
    } catch (e) { return err(String(e)); }
  }

  async verificarYConsumirState(state: string): Promise<Result<StateData | null, string>> {
    const u = base(); const h = hdrs();
    if (!u || !h) return err("config_incompleta");
    try {
      const url = `${u}/signup_state_tokens?select=signup_id,tenant_id&state=eq.${encodeURIComponent(String(state))}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&used_at=is.null&limit=1`;
      const r = await fetch(url, { headers: h });
      if (!r.ok) return err(`http_${r.status}`);
      const rows = await r.json() as Array<{ signup_id: string; tenant_id: string }>;
      if (!rows || rows.length === 0) return ok(null);
      // Single-use: marcar como usado
      const delUrl = `${u}/signup_state_tokens?state=eq.${encodeURIComponent(String(state))}`;
      await fetch(delUrl, { method: "DELETE", headers: h });
      return ok({ signupId: rows[0]!.signup_id, tenantId: rows[0]!.tenant_id });
    } catch (e) { return err(String(e)); }
  }
}