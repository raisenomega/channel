/**
 * HUB by Raisen — Fetcher de los tickets RESUELTOS (global del tenant) para el panel derecho de la
 * conversacion. Datos REALES de activity_log (event_type=resolved): quien atendio + fecha + conversacion.
 * Dedup por conversationId (el ultimo resuelto). RLS por tenant. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

export interface ResueltoRow { conversationId: string; atendio: string; createdAt: string; label: string }

export async function fetchTicketsResueltos(): Promise<ResueltoRow[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  try {
    const r = await fetch(`${base}/activity_log?event_type=eq.resolved&select=label,created_at,metadata&order=created_at.desc&limit=100`, { headers });
    if (!r.ok) return [];
    const rows = (await r.json()) as Array<Record<string, unknown>>;
    const seen = new Set<string>();
    const out: ResueltoRow[] = [];
    for (const x of rows) {
      const m = (x.metadata as { conversationId?: string; atendio?: string } | null) ?? {};
      const cid = String(m.conversationId ?? "");
      if (!cid || seen.has(cid)) continue;
      seen.add(cid);
      out.push({ conversationId: cid, atendio: String(m.atendio ?? ""), createdAt: String(x.created_at ?? ""), label: String(x.label ?? "") });
    }
    return out;
  } catch {
    return [];
  }
}
