/**
 * HUB by Raisen — Repositorio Supabase de respuestas rapidas (canned).
 * Implementa CannedResponseRepository. Patron notifications.
 * buscarPorShortcode retorna ok(null) si no existe (null es dato, no error).
 * C4 ≤75 lineas.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { CannedResponseState } from "../domain/sla-bizhours.entity.ts";
import type { CannedResponseRepository, RepoError } from "../domain/automation.repository.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

interface CannedResponseRow {
  id: string; tenant_id: string; shortcode: string; content: string; category: string;
}

function toEntity(r: CannedResponseRow): CannedResponseState {
  return {
    id: r.id,
    tenantId: r.tenant_id as TenantId,
    shortcode: r.shortcode,
    content: r.content,
    category: r.category,
  };
}

function mapErr(e: string): RepoError { return { kind: "persistence_failure", cause: e }; }

export class SupabaseCannedResponseRepo implements CannedResponseRepository {
  async guardar(response: CannedResponseState): Promise<Result<void, RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const r = await fetch(`${u}/canned_responses`, {
        method: "POST", headers: h,
        body: JSON.stringify({ id: response.id, tenant_id: response.tenantId, shortcode: response.shortcode, content: response.content, category: response.category }),
      });
      return r.ok ? ok(undefined) : err(mapErr(`http_${r.status}`));
    } catch (e) { return err(mapErr(String(e))); }
  }

  async buscar(tenantId: TenantId): Promise<Result<CannedResponseState[], RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const url = `${u}/canned_responses?select=*&tenant_id=eq.${encodeURIComponent(String(tenantId))}`;
      const r = await fetch(url, { headers: h });
      if (!r.ok) return err(mapErr(`http_${r.status}`));
      const rows = await r.json() as CannedResponseRow[];
      return ok(rows.map(toEntity));
    } catch (e) { return err(mapErr(String(e))); }
  }

  async buscarPorShortcode(tenantId: TenantId, shortcode: string): Promise<Result<CannedResponseState | null, RepoError>> {
    const u = supabaseBase(); const h = supabaseHdrs();
    if (!u || !h) return err(mapErr("config_incompleta"));
    try {
      const url = `${u}/canned_responses?select=*&tenant_id=eq.${encodeURIComponent(String(tenantId))}&shortcode=eq.${encodeURIComponent(shortcode)}&limit=1`;
      const r = await fetch(url, { headers: h });
      if (!r.ok) return err(mapErr(`http_${r.status}`));
      const rows = await r.json() as CannedResponseRow[];
      if (!rows || rows.length === 0) return ok(null);
      return ok(toEntity(rows[0]!));
    } catch (e) { return err(mapErr(String(e))); }
  }
}