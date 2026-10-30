/**
 * HUB by Raisen — Anti-rafaga de escaladas (PR1). Detecta si el agente YA tiene una escalada/consulta
 * ABIERTA (o muy reciente) del MISMO tema en la MISMA conversacion, para ANEXAR en vez de crear otra fila
 * (la rafaga: 6 escaladas del mismo caso en 30 min). Heuristica deterministica, sin LLM. RLS service-role.
 * Kill-switch vive en el repo que la llama. C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

const STOP = new Set(["de","la","el","los","las","un","una","que","en","con","por","para","del","al","se","su","sus","lo","le","es","no","sobre","cliente","mismo","aun","ya","mas","indica","solicita","pide","requiere","confirmar","falta","antes","sino","como","esta","este","hay"]);

export function temaSignature(texto: string): Set<string> {
  const norm = (texto || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ");
  return new Set(norm.split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w)));
}

// Similitud de Jaccard entre las palabras-clave de dos textos; true si comparten el mismo tema.
export function mismoTema(a: string, b: string, umbral = 0.4): boolean {
  const sa = temaSignature(a), sb = temaSignature(b);
  if (sa.size < 2 || sb.size < 2) return false; // texto muy corto -> no arriesgar merge
  let inter = 0; for (const x of sa) if (sb.has(x)) inter++;
  return inter / (sa.size + sb.size - inter) >= umbral;
}

export interface EscaladaPrevia { consultaId: string; metadata: Record<string, unknown> }

// Devuelve la escalada/consulta base del MISMO tema en la conversacion que esta ABIERTA (sin resolved) o fue
// creada dentro de la ventana -> se debe anexar a ella. null = re-pregunta legitima: se crea una nueva.
export async function buscarEscaladaDuplicada(tenantId: string, conversationId: string, detalle: string, windowMin: number): Promise<EscaladaPrevia | null> {
  try {
    if (temaSignature(detalle).size < 2) return null;
    const { data } = await supabase.from("activity_log").select("event_type, created_at, metadata")
      .eq("tenant_id", tenantId).eq("metadata->>conversationId", conversationId)
      .in("event_type", ["consulta", "escalation", "resolved"]).order("created_at", { ascending: false }).limit(40);
    const rows = (data ?? []) as Array<{ event_type?: string; created_at?: string; metadata?: Record<string, unknown> | null }>;
    const resueltas = new Set(rows.filter((r) => r.event_type === "resolved").map((r) => String((r.metadata ?? {})["consultaId"] ?? "")));
    const limite = Date.now() - windowMin * 60000;
    for (const r of rows) {
      if (r.event_type !== "consulta" && r.event_type !== "escalation") continue;
      const m = r.metadata ?? {}; const cid = String(m["consultaId"] ?? ""); if (!cid) continue;
      const abierta = !resueltas.has(cid);
      const reciente = new Date(String(r.created_at ?? 0)).getTime() >= limite;
      if (!abierta && !reciente) continue; // ni abierta ni reciente -> re-pregunta legitima, no dedup
      if (mismoTema(detalle, String(m["pregunta"] ?? ""))) return { consultaId: cid, metadata: m };
    }
    return null;
  } catch { return null; }
}
