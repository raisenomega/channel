/**
 * HUB by Raisen — N-9 (FORTRESS): persistencia anti-replay del nonce del state OAuth.
 * registrar() en init (insert single-use + TTL de migracion 048); consume() en callback
 * (PATCH atomico: marca used_at solo si estaba sin usar y no expirado -> 1 fila => primer uso).
 * service_role (bypasea RLS deny-all de 048). Idempotencia por PK nonce. C4 <=75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

export class OAuthNoncesRepository {
  async registrar(nonce: string, tenantId: string): Promise<Result<void, { readonly causa: string }>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err({ causa: "config_incompleta" });
    try {
      const r = await fetch(`${u}/oauth_nonces`, { method: "POST", headers: h, body: JSON.stringify({ nonce, tenant_id: tenantId, purpose: "oauth_state" }) });
      return r.ok ? ok(undefined) : err({ causa: `http_${r.status}` });
    } catch (e) { return err({ causa: String(e) }); }
  }

  async consume(nonce: string): Promise<boolean> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return false;
    try {
      const now = new Date().toISOString();
      const q = `${u}/oauth_nonces?nonce=eq.${encodeURIComponent(nonce)}&used_at=is.null&expires_at=gt.${encodeURIComponent(now)}`;
      const r = await fetch(q, { method: "PATCH", headers: { ...h, Prefer: "return=representation" }, body: JSON.stringify({ used_at: now }) });
      if (!r.ok) return false;
      const rows = await r.json() as unknown[];
      return Array.isArray(rows) && rows.length === 1;
    } catch { return false; }
  }
}
