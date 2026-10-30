/**
 * HUB by Raisen — Hook: borradores pendientes (cola supervisada) + cotizaciones RECHAZADAS recientes (<=30d,
 * para mostrarlas con etiqueta en Borradores). Poll 15s. reload() tras aprobar/denegar. Vacio honesto.
 */
import { useState, useEffect, useCallback } from "react";
import { apiFetch, resolveTenantId } from "@/lib/api-client";

export interface DraftItem { id: string; personaSlug: string; draftContent: string; inboundMessage: string; confidence: number; status?: string; scope?: string; contactLabel?: string; contactName?: string; contactPhone?: string; channel?: string; autoSendReason?: string; label?: string; conclusion?: string; identified?: string; closePct?: number; origen?: string; quoteItems?: Array<{ description: string; quantity: number; unit_price: number; line_total: number }>; quoteTotal?: number; quoteContactId?: string; clientDecision?: string; }
type RawMeta = { scope?: string; contactLabel?: string; contactName?: string; contactPhone?: string; channel?: string; autoSendReason?: string; label?: string; conclusion?: string; identified?: string; confidence?: number; origen?: string; quoteItems?: Array<{ description: string; quantity: number; unit_price: number; line_total: number }>; total?: number; contactId?: string; clientDecision?: string };
type RawDraft = DraftItem & { metadata?: RawMeta };

function mapPending(x: RawDraft): DraftItem {
  return { ...x, scope: x.metadata?.scope, contactLabel: x.metadata?.contactLabel, contactName: x.metadata?.contactName, contactPhone: x.metadata?.contactPhone, channel: x.metadata?.channel, autoSendReason: x.metadata?.autoSendReason, label: x.metadata?.label, conclusion: x.metadata?.conclusion, identified: x.metadata?.identified, closePct: x.metadata?.confidence, origen: x.metadata?.origen, quoteItems: x.metadata?.quoteItems, quoteTotal: x.metadata?.total, quoteContactId: x.metadata?.contactId, clientDecision: x.metadata?.clientDecision };
}
function mapRejected(x: { id: string; metadata?: RawMeta }): DraftItem {
  return { id: x.id, status: "rejected", scope: "quote", personaSlug: "", draftContent: "", inboundMessage: "", confidence: 0, label: x.metadata?.label, conclusion: x.metadata?.conclusion, contactName: x.metadata?.contactName, quoteItems: x.metadata?.quoteItems, quoteTotal: x.metadata?.total, quoteContactId: x.metadata?.contactId, clientDecision: x.metadata?.clientDecision };
}

export function useDraftsPending(): { drafts: readonly DraftItem[]; count: number; visibleCount: number; reload: () => void } {
  const [drafts, setDrafts] = useState<readonly DraftItem[]>([]);
  const load = useCallback(async () => {
    const tid = resolveTenantId();
    if (!tid) { setDrafts([]); return; }
    try {
      const b = encodeURIComponent(tid);
      const [res, rej] = await Promise.all([apiFetch(`/tenants/${b}/drafts/pending`), apiFetch(`/tenants/${b}/drafts/rejected-quotes`)]);
      const d = res.ok ? ((await res.json()) as { drafts?: RawDraft[]; enviados?: RawDraft[] }) : {};
      const rq = rej.ok ? ((await rej.json()) as { rejectedQuotes?: Array<{ id: string; metadata?: RawMeta }> }) : {};
      setDrafts([...(d.drafts ?? []).map(mapPending), ...(d.enviados ?? []).map(mapPending), ...(rq.rejectedQuotes ?? []).map(mapRejected)]);
    } catch { setDrafts([]); }
  }, []);
  useEffect(() => { load(); const id = setInterval(load, 15_000); return () => clearInterval(id); }, [load]);
  // visibleCount = lo que REALMENTE se ve en Borradores (no-cotizacion + cotizaciones rechazadas); el badge/chip usa esto (honesto).
  const visibleCount = drafts.filter((d) => d.status !== "sent" && (d.scope !== "quote" || d.status === "rejected")).length;
  return { drafts, count: drafts.length, visibleCount, reload: load };
}
