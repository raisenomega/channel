/**
 * HUB by Raisen — Conector a CEREBRO. REGLA: enriquece, no bloquea. Sin CEREBRO configurado (env) ->
 * no-op honesto. `cerebroIngest` es fire-and-forget (nunca lanza ni espera); `cerebroRetrieve` con
 * timeout corto y degradacion. El evento/request ya viajan en snake_case (contrato del paquete). C4 <=75.
 */
import { getEnv } from "../../shared/infrastructure/supabase-rest.helper.ts";
import type { CerebroEvent, RetrieveRequest, RetrieveResponse } from "../domain/cerebro.types.ts";
import { degradedResponse } from "../domain/cerebro.types.ts";

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
    body: JSON.stringify(event),
  }).catch(() => { /* fire-and-forget: nunca bloquea ni lanza */ });
}

export async function cerebroRetrieve(req: RetrieveRequest): Promise<RetrieveResponse> {
  const c = cfg();
  if (!c) return degradedResponse();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 800);
  try {
    const res = await fetch(`${c.url}/cerebro/retrieve`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${c.token}` },
      body: JSON.stringify(req),
      signal: ctrl.signal,
    });
    if (!res.ok) return degradedResponse();
    const d = (await res.json()) as Partial<RetrieveResponse>;
    return { person_id: d.person_id ?? null, chunks: d.chunks ?? [], facts: d.facts ?? [], degraded: d.degraded ?? false };
  } catch { return degradedResponse(); } finally { clearTimeout(timer); }
}
