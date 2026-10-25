/**
 * HUB by Raisen — B8: lo que el agente hizo sobre un contacto (sus agent_drafts: borrador/respuesta/cierre con
 * fecha, estado, scope, razon, confianza). Lectura ligera para la ficha (timeline). C4 <=75.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export interface ContactActivityItem {
  readonly id: string; readonly createdAt: string; readonly status: string; readonly scope: string | null;
  readonly draftContent: string; readonly reason: string; readonly confidence: number; readonly conclusion: string | null;
}

export async function draftsPorContacto(contactId: string, tenantId: string): Promise<readonly ContactActivityItem[]> {
  const { data } = await supabase.from("agent_drafts").select("id, created_at, status, draft_content, reason, confidence, metadata")
    .eq("contact_id", contactId).eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(50);
  const rows = (data ?? []) as Array<{ id: string; created_at: string; status: string; draft_content: string; reason: string; confidence: number; metadata: Record<string, unknown> | null }>;
  return rows.map((r) => ({ id: r.id, createdAt: r.created_at, status: r.status, draftContent: r.draft_content, reason: r.reason, confidence: Number(r.confidence), scope: (r.metadata?.["scope"] as string) ?? null, conclusion: (r.metadata?.["conclusion"] as string) ?? null }));
}

export async function contactMeta(contactId: string, tenantId: string): Promise<{ notes: unknown[]; temperature: string | null }> {
  const { data } = await supabase.from("contacts").select("notes, temperature").eq("id", contactId).eq("tenant_id", tenantId).maybeSingle();
  const r = (data ?? {}) as { notes?: unknown[]; temperature?: string | null };
  return { notes: Array.isArray(r.notes) ? r.notes : [], temperature: r.temperature ?? null };
}
