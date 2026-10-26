/**
 * HUB by Raisen — Sistema B 2b: lecturas para el cerrador. Hilo de la conversacion (como ThreadMsg),
 * estado de seguimiento (cuantos borradores estrategicos + el ultimo) y contexto corto del negocio. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { contextoMemorizado } from "./context-reader.ts";
import type { ThreadMsg } from "../application/closing-draft.producer.ts";

export async function leerHilo(convId: string, limite = 20): Promise<readonly ThreadMsg[]> {
  // Los 40 mensajes MAS RECIENTES (desc + reverse). Antes era ascending+limit -> traia los MAS VIEJOS, por
  // eso el agente "olvidaba" en hilos largos (ej. 332 msgs): nunca veia donde el cliente dio los datos.
  const { data } = await supabase.from("messages").select("direction, content, created_at").eq("conversation_id", convId).order("created_at", { ascending: false }).limit(limite); // 20 por defecto (respuesta); la captura pide mas para no perder datos
  const rows = (data ?? []) as Array<{ direction: string; content: string | null }>;
  const turnos = rows
    .map((r) => ({ from: (r.direction === "inbound" ? "cliente" : "negocio") as "cliente" | "negocio", text: (r.content ?? "").slice(0, 500) }))
    .filter((m) => m.text.trim() && !/^\[[^\]]+\]$/.test(m.text.trim())); // descarta vacios y placeholders [Imagen]/[Reel]
  return turnos.reverse(); // cronologico: viejo -> nuevo
}

export async function estadoSeguimiento(convId: string): Promise<{ intentos: number; ultimoBorradorAt: string | null }> {
  const { data } = await supabase.from("agent_drafts").select("created_at").eq("conversation_id", convId).eq("metadata->>scope", "strategic").order("created_at", { ascending: false });
  const rows = (data ?? []) as Array<{ created_at: string }>;
  return { intentos: rows.length, ultimoBorradorAt: rows[0]?.created_at ?? null };
}

export async function contextoCorto(tenantId: string): Promise<string> {
  return (await contextoMemorizado(tenantId)).brandVoice || "(sin contexto)"; // Sistema B: contexto COMPLETO byte a byte + memoria (sin tope)
}

export async function bajoTopeDiario(tenantId: string, cap: number): Promise<boolean> {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const { count } = await supabase.from("agent_drafts").select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId).eq("metadata->>scope", "strategic").gte("created_at", hoy.toISOString());
  return (count ?? 0) < cap;
}
