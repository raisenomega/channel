/**
 * HUB by Raisen — Hook: borradores pendientes (cola supervisada). Poll 15s. reload() tras aprobar/denegar.
 * Sin tenant/red -> vacio honesto.
 */
import { useState, useEffect, useCallback } from "react";
import { apiFetch, resolveTenantId } from "@/lib/api-client";

export interface DraftItem { id: string; personaSlug: string; draftContent: string; inboundMessage: string; confidence: number; scope?: string; contactLabel?: string; contactName?: string; contactPhone?: string; channel?: string; }
type RawMeta = { scope?: string; contactLabel?: string; contactName?: string; contactPhone?: string; channel?: string };
type RawDraft = DraftItem & { metadata?: RawMeta };

export function useDraftsPending(): { drafts: readonly DraftItem[]; count: number; reload: () => void } {
  const [drafts, setDrafts] = useState<readonly DraftItem[]>([]);
  const load = useCallback(async () => {
    const tid = resolveTenantId();
    if (!tid) { setDrafts([]); return; }
    try {
      const res = await apiFetch(`/tenants/${encodeURIComponent(tid)}/drafts/pending`);
      if (res.ok) {
        const d = (await res.json()) as { drafts?: RawDraft[] };
        setDrafts((d.drafts ?? []).map((x) => ({ ...x, scope: x.metadata?.scope, contactLabel: x.metadata?.contactLabel, contactName: x.metadata?.contactName, contactPhone: x.metadata?.contactPhone, channel: x.metadata?.channel })));
      } else { setDrafts([]); }
    } catch { setDrafts([]); }
  }, []);
  useEffect(() => { load(); const id = setInterval(load, 15_000); return () => clearInterval(id); }, [load]);
  return { drafts, count: drafts.length, reload: load };
}
