/**
 * HUB by Raisen — Poner una cita "en cola" de envio (guarda los canales elegidos en send_channels).
 * El disparo real por WA/IG/FB lo hara el backend cuando vuelva Railway (lee send_channels). C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

export async function queueSend(id: string, channels: string[]): Promise<{ ok: boolean }> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return { ok: false };
  try {
    const res = await fetch(`${base}/appointments?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...headers, "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({ send_channels: channels }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
