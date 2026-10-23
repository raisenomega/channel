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

export function cerebroIngest(event: CerebroEvent): void {
  const c = cfg();
  if (!c) return;
  void fetch(`${c.url}/cerebro/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${c.token}` },
    body: JSON.stringify({ ...event, source_platform: "hub" }),
  }).catch(() => { /* fire-and-forget: nunca bloquea ni lanza */ });
}

export async function cerebroRetrieve(params: CerebroRetrieveParams): Promise<CerebroContext> {
  const c = cfg();
  if (!c) return EMPTY;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 800);
  try {
    const res = await fetch(`${c.url}/cerebro/retrieve`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${c.token}` },
      body: JSON.stringify({ ...params, requesting_platform: "hub" }),
      signal: ctrl.signal,
    });
    if (!res.ok) return EMPTY;
    const d = (await res.json()) as Partial<CerebroContext>;
    return { personId: d.personId ?? null, chunks: d.chunks ?? [], facts: d.facts ?? [], degraded: d.degraded ?? false };
  } catch { return EMPTY; } finally { clearTimeout(timer); }
}
