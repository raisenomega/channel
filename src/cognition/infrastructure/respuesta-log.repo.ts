/**
 * HUB by Raisen — Registro PERSISTENTE del resultado de cada respuesta del agente (respondio/no_send/error +
 * razon + intentos). Cierra la ceguera del fire-and-forget: ya NO hay fallos invisibles. Fail-safe. C4 <=75.
 */
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";
import type { AutodraftEvent } from "../application/maybe-autodraft.service.ts";

export async function registrarResultadoRespuesta(ev: AutodraftEvent, outcome: string, reason: string, intentos: number): Promise<void> {
  try {
    const base = supabaseBase();
    const hdrs = supabaseHdrs();
    if (!base || !hdrs) return;
    await fetch(`${base}/agent_response_log`, {
      method: "POST", headers: { ...hdrs, Prefer: "return=minimal" },
      body: JSON.stringify({ tenant_id: ev.tenantId, conversation_id: ev.conversationId ?? null, channel: ev.channel, outcome, reason, intentos, inbound: ev.content.slice(0, 200) }),
    });
  } catch { /* fail-safe: la observabilidad nunca rompe la respuesta */ }
}
