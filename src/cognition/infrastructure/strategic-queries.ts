/**
 * HUB by Raisen — Sistema B 2b: lecturas para el cerrador. Hilo de la conversacion (como ThreadMsg),
 * estado de seguimiento (cuantos borradores estrategicos + el ultimo) y contexto corto del negocio. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { leerContexto } from "./context.repo.ts";
import { buildFacts } from "../domain/business-facts.ts";
import type { ThreadMsg } from "../application/closing-draft.producer.ts";

export async function leerHilo(convId: string): Promise<readonly ThreadMsg[]> {
  const { data } = await supabase.from("messages").select("direction, content").eq("conversation_id", convId).order("created_at", { ascending: true }).limit(50);
  const rows = (data ?? []) as Array<{ direction: string; content: string | null }>;
  return rows
    .map((r) => ({ from: (r.direction === "inbound" ? "cliente" : "negocio") as "cliente" | "negocio", text: (r.content ?? "").slice(0, 500) }))
    .filter((m) => m.text.trim());
}

export async function estadoSeguimiento(convId: string): Promise<{ intentos: number; ultimoBorradorAt: string | null }> {
  const { data } = await supabase.from("agent_drafts").select("created_at").eq("conversation_id", convId).eq("metadata->>scope", "strategic").order("created_at", { ascending: false });
  const rows = (data ?? []) as Array<{ created_at: string }>;
  return { intentos: rows.length, ultimoBorradorAt: rows[0]?.created_at ?? null };
}

export async function contextoCorto(tenantId: string): Promise<string> {
  const ctx = await leerContexto(tenantId);
  return buildFacts(ctx).join(" | ").slice(0, 1200) || "(sin contexto)";
}
