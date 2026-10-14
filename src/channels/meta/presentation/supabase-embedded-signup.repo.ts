/**
 * HUB by Raisen — Implementacion Supabase de EmbeddedSignupRepository + InitSignupRepository + StateVerifier.
 * C4 ≤75 lineas.
 */
import { ok, err } from "../../../shared/domain/result.ts";
import type { Result } from "../../../shared/domain/result.ts";
import type { EmbeddedSignupStatus } from "../domain/embedded-signup.entity.ts";
import type { EmbeddedSignupRepository } from "../application/embedded-signup.repo.ts";
import type { InitSignupRepository } from "../application/init-signup.handler.ts";
import type { StateVerifier } from "../application/handle-callback.handler.ts";

declare const process: { env: Record<string, string | undefined> };

function getEnv(n: string): string | undefined {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  return d?.env?.get ? d.env.get(n) : process.env[n];
}

export class SupabaseEmbeddedSignupRepo implements EmbeddedSignupRepository, InitSignupRepository, StateVerifier {
  private baseURL(): string | null { return getEnv("SUPABASE_URL") ?? null; }
  private headers(): Record<string, string> | null {
    const k = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    return k ? { apikey: k, Authorization: `Bearer ${k}`, "content-type": "application/json" } : null;
  }

  // ─── EmbeddedSignupRepository ──────────────────────────
  async buscarPorMetaId(metaId: string): Promise<Result<{ id: string; tenantId: string; status: EmbeddedSignupStatus } | null, string>> {
    const base = this.baseURL();
    const hdrs = this.headers();
    if (!base || !hdrs) return err("config_incompleta");
    try {
      const res = await fetch(`${base}/embedded_signups?select=id,tenant_id,status&meta_webhook_id=eq.${encodeURIComponent(String(metaId))}&limit=1`, { headers: hdrs });
      if (!res.ok) return err(`http_${res.status}`);
      const rows = await res.json() as Array<{ id: string; tenant_id: string; status: string }>;
      if (!rows || rows.length === 0) return ok(null);
      return ok({ id: rows[0]!.id, tenantId: rows[0]!.tenant_id, status: rows[0]!.status as EmbeddedSignupStatus });
    } catch (e) { return err(String(e)); }
  }

  async actualizar(signupId: string, data: Record<string, unknown>): Promise<Result<void, string>> {
    const base = this.baseURL();
    const hdrs = this.headers();
    if (!base || !hdrs) return err("config_incompleta");
    try {
      const res = await fetch(`${base}/embedded_signups?id=eq.${signupId}`, { method: "PATCH", headers: hdrs, body: JSON.stringify(data) });
      return res.ok ? ok(undefined) : err(`http_${res.status}`);
    } catch (e) { return err(String(e)); }
  }

  async guardarToken(signupId: string, tenantId: string, accessToken: string, expiresAt: string): Promise<Result<void, string>> {
    const { TokenVaultRepository } = await import("../infrastructure/token-vault.repo.ts");
    const res = await new TokenVaultRepository().guardar(signupId, tenantId, accessToken, expiresAt);
    if (!res.ok) return err((res.error as { cause: string }).cause ?? "error_desconocido");
    return ok(undefined);
  }

  // ─── InitSignupRepository ──────────────────────────────
  async guardarState(tenantId: string, state: string, appId: string, callbackUrl: string, expiresAt: string): Promise<Result<void, string>> {
    const base = this.baseURL();
    const hdrs = this.headers();
    if (!base || !hdrs) return err("config_incompleta");
    try {
      const res = await fetch(`${base}/signup_state_tokens`, { method: "POST", headers: hdrs, body: JSON.stringify({ tenant_id: tenantId, state, app_id: appId, callback_url: callbackUrl, expires_at: expiresAt }) });
      return res.ok ? ok(undefined) : err(`http_${res.status}`);
    } catch (e) { return err(String(e)); }
  }

  async crearSignup(tenantId: string, signupId: string, _state: string): Promise<Result<void, string>> {
    const base = this.baseURL();
    const hdrs = this.headers();
    if (!base || !hdrs) return err("config_incompleta");
    try {
      const res = await fetch(`${base}/embedded_signups`, { method: "POST", headers: hdrs, body: JSON.stringify({ id: signupId, tenant_id: tenantId, status: "CREATED" }) });
      return res.ok ? ok(undefined) : err(`http_${res.status}`);
    } catch (e) { return err(String(e)); }
  }

  // ─── StateVerifier ─────────────────────────────────────
  async verificarState(state: string, tenantId: string): Promise<Result<boolean, string>> {
    const base = this.baseURL();
    const hdrs = this.headers();
    if (!base || !hdrs) return err("config_incompleta");
    try {
      const url = `${base}/signup_state_tokens?select=id&state=eq.${encodeURIComponent(String(state))}&tenant_id=eq.${encodeURIComponent(String(tenantId))}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&limit=1`;
      const res = await fetch(url, { headers: hdrs });
      if (!res.ok) return err(`http_${res.status}`);
      const rows = await res.json() as Array<{ id: string }>;
      return ok(rows && rows.length > 0);
    } catch (e) { return err(String(e)); }
  }
}