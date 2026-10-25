/**
 * HUB by Raisen — B8: trae la actividad del agente sobre un contacto (sus agent_drafts) via el API HUB.
 */
import { apiFetch, resolveTenantId } from "@/lib/api-client";

export interface ContactActivityItem {
  id: string; createdAt: string; status: string; scope: string | null;
  draftContent: string; reason: string; confidence: number; conclusion: string | null;
}

export async function fetchContactActivity(contactId: string): Promise<ContactActivityItem[]> {
  const tid = resolveTenantId();
  if (!tid) return [];
  try {
    const r = await apiFetch(`/tenants/${encodeURIComponent(tid)}/contacts/${encodeURIComponent(contactId)}/activity`);
    if (!r.ok) return [];
    const j = (await r.json()) as { activity?: ContactActivityItem[] };
    return j.activity ?? [];
  } catch {
    return [];
  }
}
