/**
 * HUB by Raisen — Conector a CEREBRO. REGLA: enriquece, no bloquea. Sin CEREBRO configurado (env) ->
 * no-op honesto. `ingest` es fire-and-forget (nunca lanza ni espera); `retrieve` con timeout corto y
 * degradacion a contexto vacio. Unica capa que toca la red de CEREBRO. C4 <=75.
 */
import { getEnv } from "../../shared/infrastructure/supabase-rest.helper.ts";
import type { CerebroEvent, CerebroRetrieveParams, CerebroContext } from "../domain/cerebro.types.ts";

const EMPTY: CerebroContext = { personId: null, chunks: [], facts: [], degraded: true };

function cfg(): { url: string; token: string } | null {
  const url = getEnv("CEREBRO_URL");
  const token = getEnv("CEREBRO_SERVICE_TOKEN");
  return url && token ? { url, token } : null;
}

// Mapea el evento (dominio camelCase) al contrato REAL de cerebro (snake_case, @raisen/cerebro-contracts).
function eventoWire(e: CerebroEvent): Record<string, unknown> {
  return { event: e.event, source_platform: "hub", tenant_id: e.tenantId, occurred_at: e.occurredAt, identity: { id_type: e.identity.idType, id_value: e.identity.idValue }, payload: e.payload };
}

export function cerebroIngest(event: CerebroEvent): void {
  const c = cfg();
  if (!c) return;
  void fetch(`${c.url}/cerebro/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${c.token}` },
    body: JSON.stringify(eventoWire(event)),
  }).catch(() => { /* fire-and-forget: nunca bloquea ni lanza */ });
}

export async function cerebroRetrieve(params: CerebroRetrieveParams): Promise<CerebroContext> {
  const c = cfg();
  if (!c) return EMPTY;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 800);
  const body = { identity: { id_type: params.identity.idType, id_value: params.identity.idValue }, query: params.query, requesting_agent: params.requestingAgent, requesting_platform: "hub", tenant_id: params.tenantId, max_chunks: params.maxChunks ?? 6 };
  try {
    const res = await fetch(`${c.url}/cerebro/retrieve`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${c.token}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) return EMPTY;
    const d = (await res.json()) as { person_id?: string | null; chunks?: Array<{ kind: string; content: string; source_platform: string; score: number }>; facts?: Array<{ text: string }>; degraded?: boolean };
    return { personId: d.person_id ?? null, chunks: (d.chunks ?? []).map((ch) => ({ kind: ch.kind, content: ch.content, sourcePlatform: ch.source_platform, score: ch.score })), facts: (d.facts ?? []).map((f) => ({ text: f.text })), degraded: d.degraded ?? false };
  } catch { return EMPTY; } finally { clearTimeout(timer); }
}
