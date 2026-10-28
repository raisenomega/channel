/**
 * HUB by Raisen — Fetchers de la pagina Escaladas (tickets de escalada humana) y del badge.
 * Datos REALES de activity_log (event_type=escalation) + estado de la conversacion (abierto/resuelto).
 * Dedup por conversationId. RLS por tenant. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { ActivityRow } from "@/lib/alerts/alerts-activity";

export interface Ticket { conversationId: string; label: string; createdAt: string; status: string }

async function get(path: string): Promise<Array<Record<string, unknown>>> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  try {
    const r = await fetch(`${base}${path}`, { headers });
    return r.ok ? ((await r.json()) as Array<Record<string, unknown>>) : [];
  } catch {
    return [];
  }
}

// Para el badge: una fila por escalada (clave "escaladas").
export async function fetchEscalationActivity(): Promise<ActivityRow[]> {
  const rows = await get(`/activity_log?select=created_at&event_type=eq.escalation&order=created_at.desc&limit=200`);
  return rows.map((r) => ({ key: "escaladas", created_at: String(r.created_at ?? "") }));
}

// Para la pagina: tickets (dedup por conversacion) + estado actual de cada conversacion.
export async function fetchEscaladas(): Promise<Ticket[]> {
  const rows = await get(`/activity_log?event_type=eq.escalation&select=label,created_at,metadata&order=created_at.desc&limit=100`);
  const seen = new Set<string>();
  const tickets: Ticket[] = [];
  for (const r of rows) {
    const cid = String((r.metadata as { conversationId?: string } | null)?.conversationId ?? "");
    if (!cid || seen.has(cid)) continue;
    seen.add(cid);
    tickets.push({ conversationId: cid, label: String(r.label ?? "Escalacion"), createdAt: String(r.created_at ?? ""), status: "open" });
  }
  if (tickets.length === 0) return tickets;
  const convs = await get(`/conversations?id=in.(${tickets.map((x) => x.conversationId).join(",")})&select=id,status`);
  const st: Record<string, string> = {};
  for (const c of convs) st[String(c.id)] = String(c.status ?? "open");
  return tickets.map((x) => ({ ...x, status: st[x.conversationId] ?? "open" }));
}
