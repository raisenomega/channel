/**
 * HUB by Raisen — Cliente de reportes y KPIS agregados.
 * Queries reales a Supabase REST (conversations, messages, agent_interactions).
 * Sin datos mock (N5).
 */
import { supabaseRestBase, supabaseAuthHeaders } from "./supabase";

export type ReportError = { kind: "no_autorizado" | "red" | "config_incompleta"; cause?: string };
export type Result<T> = { ok: true; value: T } | { ok: false; error: ReportError };

export interface ReportKpis {
  totalConversations: number;
  totalMessages: number;
  closeRate: number | null;
  wasCorrectAvg: number | null;
}

// COUNT REAL via PostgREST: Prefer count=exact + Range 0-0 -> no baja filas, lee el total del header
// Content-Range ("0-0/1234"). Antes se contaba .length de un SELECT, topado a 1000 por defecto (bug: se
// quedaba fijo en 1000). RLS filtra por tenant con el token del usuario.
async function countOf(base: string, headers: Record<string, string>, path: string): Promise<number> {
  try {
    const res = await fetch(`${base}/${path}`, { headers: { ...headers, Prefer: "count=exact", Range: "0-0" } });
    if (!res.ok && res.status !== 206) return 0;
    const total = parseInt((res.headers.get("content-range") ?? "").split("/")[1] ?? "0", 10);
    return Number.isFinite(total) ? total : 0;
  } catch { return 0; }
}

export interface KpiCounts { total: number; abiertas: number; sinAsignar: number }

// COUNT REAL de las conversaciones del tenant (RLS) para las tarjetas del dashboard. Antes salian de las
// ultimas 50 del inbox (limit=50) -> no eran el total real. Esto da el total honesto, no una muestra.
export async function fetchKpiCounts(): Promise<KpiCounts> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders() as Record<string, string> | null;
  if (!base || !headers) return { total: 0, abiertas: 0, sinAsignar: 0 };
  const [total, abiertas, sinAsignar] = await Promise.all([
    countOf(base, headers, "conversations?select=id"),
    countOf(base, headers, "conversations?select=id&status=eq.open"),
    countOf(base, headers, "conversations?select=id&assigned_agent_id=is.null"),
  ]);
  return { total, abiertas, sinAsignar };
}

export async function fetchReportKpis(): Promise<Result<ReportKpis>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders() as Record<string, string> | null;
  if (!base || !headers) return { ok: false, error: { kind: "config_incompleta" } };
  try {
    const [totalConversations, totalMessages, closed, totalInter, correct] = await Promise.all([
      countOf(base, headers, "conversations?select=id"),
      countOf(base, headers, "messages?select=id"),
      countOf(base, headers, "conversations?select=id&status=in.(resolved,closed)"),
      countOf(base, headers, "agent_interactions?select=id"),
      countOf(base, headers, "agent_interactions?select=id&was_correct=is.true"),
    ]);
    const closeRate = totalConversations > 0 ? (closed / totalConversations) * 100 : null;
    const wasCorrectAvg = totalInter > 0 ? (correct / totalInter) * 100 : null;
    return { ok: true, value: { totalConversations, totalMessages, closeRate, wasCorrectAvg } };
  } catch (e) {
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}