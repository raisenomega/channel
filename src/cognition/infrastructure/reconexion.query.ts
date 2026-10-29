/**
 * HUB by Raisen — D (reconexion): datos para que el agente le responda al CLIENTE tras resolver una
 * consulta/escalada. Lee la conversacion (a quien, por que canal) + el ultimo mensaje ENTRANTE del cliente
 * (lo que quedo sin responder). Solo lectura, degrade-safe (null si falla). C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export interface DatosReconexion { from: string; channel: string; contactId: string; content: string }

export async function datosReconexion(convId: string): Promise<DatosReconexion | null> {
  if (!convId) return null;
  try {
    const { data: c } = await supabase.from("conversations").select("participant_external_id, primary_channel, contact_id").eq("id", convId).single();
    if (!c) return null;
    const { data: m } = await supabase.from("messages").select("content").eq("conversation_id", convId).eq("direction", "inbound").order("created_at", { ascending: false }).limit(1);
    const row = (Array.isArray(m) ? m[0] : null) as { content?: { body?: string } | string | null } | null;
    const raw = row?.content;
    const content = typeof raw === "object" && raw ? String(raw.body ?? "") : String(raw ?? "");
    const cc = c as { participant_external_id?: string; primary_channel?: string; contact_id?: string };
    return { from: String(cc.participant_external_id ?? ""), channel: String(cc.primary_channel ?? ""), contactId: String(cc.contact_id ?? ""), content };
  } catch {
    return null;
  }
}
