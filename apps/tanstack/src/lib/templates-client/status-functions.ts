/**
 * HUB by Raisen — Estado EN VIVO de plantillas (Meta via backend). name -> status. C4 <=75.
 */
import { apiFetch } from "../api-client";
import { ensureTenantId } from "../tenant-client/mi-tenant";
import type { WhatsAppTemplate, TemplateStatus } from "./types";

interface LiveStatus { name: string; language: string; status: string; category: string; body?: string; rejectionReason?: string | null }

const MAP_ST: Record<string, TemplateStatus> = {
  APPROVED: "approved", PENDING: "pending_meta", REJECTED: "rejected", PAUSED: "paused", DISABLED: "disabled",
};

async function fetchStatuses(): Promise<LiveStatus[]> {
  const tenantId = await ensureTenantId();
  if (!tenantId) return [];
  try {
    const res = await apiFetch(`/tenants/${tenantId}/templates/status`);
    if (!res.ok) return [];
    const j = (await res.json()) as { statuses?: LiveStatus[] };
    return j.statuses ?? [];
  } catch {
    return [];
  }
}

export async function estadoPlantillas(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const s of await fetchStatuses()) map[s.name] = s.status;
  return map;
}

export async function plantillasReales(): Promise<WhatsAppTemplate[]> {
  return (await fetchStatuses()).map((s) => ({
    id: `${s.name}:${s.language}`, name: s.name, language: s.language, category: s.category,
    status: MAP_ST[s.status] ?? "error", body: s.body ?? "",
    header_type: null, header_content: null, footer: null, zernio_template_id: null,
    rejection_reason: s.rejectionReason ?? null, created_at: "", updated_at: "",
  }));
}
