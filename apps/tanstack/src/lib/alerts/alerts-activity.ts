/**
 * HUB by Raisen — Fetchers de actividad para badges (Opción B: polling, datos REALES, cero mocks).
 * Devuelven filas {key, created_at}; el provider cuenta cuántas son posteriores a la última vez que
 * viste esa clave. RLS en todas las tablas -> solo tu tenant. Fuente nueva = otro fetcher aquí.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

export interface ActivityRow { key: string; created_at: string }

async function get(path: string): Promise<Array<Record<string, unknown>>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  try {
    const res = await fetch(`${base}${path}`, { headers });
    return res.ok ? ((await res.json()) as Array<Record<string, unknown>>) : [];
  } catch {
    return [];
  }
}

// Mensajes ENTRANTES por canal -> key `channel:<canal>`.
export async function fetchInboundActivity(): Promise<ActivityRow[]> {
  const rows = await get(`/messages?select=channel,created_at&direction=eq.inbound&order=created_at.desc&limit=200`);
  return rows.map((r) => ({ key: `channel:${String(r.channel ?? "")}`, created_at: String(r.created_at ?? "") }));
}

// CRM (órdenes / pagos / cotizaciones) recientes -> key `crm:<tipo>`.
export async function fetchCrmActivity(): Promise<ActivityRow[]> {
  const [o, p, q] = await Promise.all([
    get(`/orders?select=created_at&order=created_at.desc&limit=100`),
    get(`/payments?select=created_at&order=created_at.desc&limit=100`),
    get(`/quotes?select=created_at&order=created_at.desc&limit=100`),
  ]);
  const map = (rows: Array<Record<string, unknown>>, key: string): ActivityRow[] => rows.map((r) => ({ key, created_at: String(r.created_at ?? "") }));
  return [...map(o, "crm:orders"), ...map(p, "crm:payments"), ...map(q, "crm:quotes")];
}
