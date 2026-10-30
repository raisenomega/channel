/**
 * HUB by Raisen — D (evidencia): drafts de RECONEXION recientes (metadata.origen = consulta/escalada) que YA
 * se ENVIARON (modo autonomo). Se muestran en Borradores con etiqueta honesta + "enviado" (read-only, clicable
 * para ver que hizo el agente). Los pendientes (supervisado) ya salen por listarPendientes. Solo lectura,
 * degrade-safe (lista vacia si falla). C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export interface EvidenciaDraft { id: string; personaSlug: string; draftContent: string; inboundMessage: string; confidence: number; status: string; metadata: Record<string, unknown>; }

export async function listarEvidenciaReconexion(tenantId: string): Promise<EvidenciaDraft[]> {
  try {
    const desde = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data } = await supabase.from("agent_drafts")
      .select("id, persona_slug, draft_content, inbound_message, confidence, status, metadata")
      .eq("tenant_id", tenantId).eq("status", "sent").gte("sent_at", desde)
      .not("metadata->>origen", "is", null).order("sent_at", { ascending: false }).limit(20);
    const rows = (Array.isArray(data) ? data : []) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: String(r.id ?? ""), personaSlug: String(r.persona_slug ?? ""), draftContent: String(r.draft_content ?? ""),
      inboundMessage: String(r.inbound_message ?? ""), confidence: Number(r.confidence ?? 0), status: "sent",
      metadata: (r.metadata ?? {}) as Record<string, unknown>,
    }));
  } catch {
    return [];
  }
}
