/**
 * HUB by Raisen — B (coherencia): ¿respondió un HUMANO o yo (AGENTE IA) al cliente hace poco? Lee los
 * SALIENTES recientes del hilo (gracias a sender_type ai_agent vs human_agent, PR A #268). humano = hay
 * human_agent dentro de la ventana humana; ia = hay ai_agent dentro de la ventana corta (debounce). FAIL-OPEN:
 * ante error -> {false,false} y el envío procede (nunca mata el envío). Solo lectura. C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export async function presenciaSaliente(convId: string, ventanaHumanoMs: number, ventanaIaMs: number): Promise<{ humano: boolean; ia: boolean }> {
  if (!convId) return { humano: false, ia: false };
  try {
    const desde = new Date(Date.now() - Math.max(ventanaHumanoMs, ventanaIaMs)).toISOString();
    const { data } = await supabase.from("messages").select("sender_type, created_at")
      .eq("conversation_id", convId).eq("direction", "outbound").gte("created_at", desde)
      .order("created_at", { ascending: false }).limit(20);
    const rows = (Array.isArray(data) ? data : []) as Array<{ sender_type?: string; created_at?: string }>;
    const now = Date.now();
    const edad = (r: { created_at?: string }) => now - Date.parse(String(r.created_at ?? ""));
    return {
      humano: rows.some((r) => r.sender_type === "human_agent" && edad(r) <= ventanaHumanoMs),
      ia: rows.some((r) => r.sender_type === "ai_agent" && edad(r) <= ventanaIaMs),
    };
  } catch {
    return { humano: false, ia: false };
  }
}
