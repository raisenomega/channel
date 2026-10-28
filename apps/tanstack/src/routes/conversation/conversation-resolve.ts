/**
 * HUB by Raisen — Estado del ticket de la conversacion. [Solucionado] -> status=resolved + record en
 * activity_log (event_type=resolved, autor+fecha+conversationId = evidencia/record). [Mantener abierto]
 * -> status=open. Directo a PostgREST con RLS por tenant (mismo patron que channel_read_state). C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import { readLocalSession } from "@/lib/auth";
import { enc } from "./conversation-format";

function identity(): { tenantId: string; userId: string } | null {
  const s = readLocalSession();
  if (!s?.access_token || !s.user?.id) return null;
  try {
    const b64 = (s.access_token.split(".")[1] ?? "").replace(/-/g, "+").replace(/_/g, "/");
    const p = JSON.parse(atob(b64)) as { app_metadata?: { tenant_id?: string } };
    const tenantId = p.app_metadata?.tenant_id;
    return tenantId ? { tenantId, userId: s.user.id } : null;
  } catch { return null; }
}

async function registrarResolucion(conversationId: string, id: { tenantId: string; userId: string }, atendio: string, nota: string): Promise<void> {
  const base = supabaseRestBase(); const headers = supabaseAuthHeaders();
  if (!base || !headers) return;
  try {
    await fetch(`${base}/activity_log`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({ tenant_id: id.tenantId, event_type: "resolved", label: atendio ? `Atendio ${atendio}` : "Ticket resuelto", metadata: { conversationId, resolvedBy: id.userId, atendio, nota } }),
    });
  } catch { /* best-effort: el record no bloquea */ }
}

export async function cambiarEstadoTicket(conversationId: string, status: "resolved" | "open", atendio = "", nota = ""): Promise<boolean> {
  const base = supabaseRestBase(); const headers = supabaseAuthHeaders(); const id = identity();
  if (!base || !headers) return false;
  try {
    const res = await fetch(`${base}/conversations?id=eq.${enc(conversationId)}`, {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return false;
    if (status === "resolved" && id) await registrarResolucion(conversationId, id, atendio, nota);
    return true;
  } catch { return false; }
}
