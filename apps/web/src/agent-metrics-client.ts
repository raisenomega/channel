import { Result, err, ok } from "@shared/domain/result.ts";
import type { SessionUsuario } from "./auth-client.ts";
import { calcularAutonomia, calcularInteracciones } from "./agent-metrics-calc.ts";

export interface AgentMetricsData {
  readonly totalInteractions: number;
  readonly wasCorrectRate: number | null;
  readonly indistinguishability: number | null;
  readonly autonomousRate: number | null;
  readonly avgLatencyMs: number | null;
}

export type AgentMetricsView =
  | { readonly status: "loading" }
  | { readonly status: "empty" }
  | { readonly status: "error" }
  | { readonly status: "ready"; readonly metrics: AgentMetricsData };

export type AgentMetricsError =
  | { readonly kind: "config_incompleta" }
  | { readonly kind: "no_autorizado" }
  | { readonly kind: "red"; readonly cause: string };

interface HubConfig { readonly supabaseUrl: string; readonly anonKey: string; }

function config(): HubConfig {
  const g = globalThis as Record<string, unknown>;
  const cfg = g.__HUB_CONFIG__ as HubConfig | undefined;
  return { supabaseUrl: cfg?.supabaseUrl ?? "", anonKey: cfg?.anonKey ?? "" };
}

let cache: AgentMetricsView = { status: "loading" };

export function verMetricas(): AgentMetricsView {
  return cache;
}

export function reiniciarMetricas(): void {
  cache = { status: "loading" };
}
export async function cargarMetricasAgente(s: SessionUsuario): Promise<Result<AgentMetricsView, AgentMetricsError>> {
  const { supabaseUrl, anonKey } = config();
  if (!supabaseUrl || !anonKey) return cacheErr({ kind: "config_incompleta" });
  try {
    const [interacciones, episodios] = await Promise.all([
      traer(`${supabaseUrl}/rest/v1/agent_interactions?select=was_correct,indistinguishability_score,latency_ms`, anonKey, s.accessToken),
      traer(`${supabaseUrl}/rest/v1/agent_episodes?select=was_autonomous`, anonKey, s.accessToken),
    ]);
    cache = interacciones.length > 0 || episodios.length > 0
      ? { status: "ready", metrics: combinar(interacciones, episodios) }
      : { status: "empty" };
    return ok(cache);
  } catch (e) {
    return cacheErr({ kind: "red", cause: String(e) });
  }
}

async function traer(url: string, anonKey: string, token: string): Promise<Array<Record<string, unknown>>> {
  const res = await fetch(url, {
    headers: { apikey: anonKey, authorization: `Bearer ${token}`, accept: "application/json" },
  });
  if (res.status === 401 || res.status === 403) throw new Error("no_autorizado");
  if (!res.ok) throw new Error(`status ${res.status}`);
  return (await res.json()) as Array<Record<string, unknown>>;
}

function combinar(interacciones: Array<Record<string, unknown>>, episodios: Array<Record<string, unknown>>): AgentMetricsData {
  const base = calcularInteracciones(interacciones);
  return Object.freeze({ ...base, autonomousRate: calcularAutonomia(episodios) });
}

function cacheErr(e: AgentMetricsError): Result<AgentMetricsView, AgentMetricsError> {
  cache = { status: "error" };
  return err(e);
}