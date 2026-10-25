/**
 * HUB by Raisen — P2: tarjeta (estilo Borradores) de la cotizacion que propuso el agente, en el chip
 * Cotizacion del Inbox. Clic en la tarjeta = vista previa. [Firmar] crea la cotizacion real y abre el envio
 * al cliente (link por su canal) -> le LLEGA. [Descartar] la rechaza. onDone refresca. C4 <=75.
 */
import { useState } from "react";
import { apiFetch, resolveTenantId } from "@/lib/api-client";
import { t, type Idioma } from "@/lib/i18n";
import type { DraftItem } from "@/hooks/useDraftsPending";
import { firmarCotizacion } from "@/components/dashboard/agents/firmar-cotizacion";
import { QuoteProposalPreview } from "./quote-proposal-preview";
import { QuoteSendModal } from "@/routes/quotes/quote-send-modal";

export function AgentQuoteProposal({ lang, draft, onDone }: { lang: Idioma; draft: DraftItem; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [sendId, setSendId] = useState<string | null>(null);
  const act = async (firmar: boolean) => {
    const tid = resolveTenantId();
    if (!tid || busy) return;
    setBusy(true);
    try {
      if (firmar) {
        const qid = await firmarCotizacion(draft);
        if (!qid) { setBusy(false); return; }
        await apiFetch(`/tenants/${encodeURIComponent(tid)}/drafts/${draft.id}/approve`, { method: "POST", body: "{}" });
        setSendId(qid); // abre el envio al cliente (QuoteSendModal acuna el link y lo manda por su canal)
      } else {
        await apiFetch(`/tenants/${encodeURIComponent(tid)}/drafts/${draft.id}/reject`, { method: "POST", body: JSON.stringify({ reason: "Descartada" }) });
        onDone();
      }
    } catch { /* */ }
    setBusy(false);
  };
  const green = "hsl(145 55% 42%)";
  return (
    <>
      <div onClick={() => setPreview(true)} className="flex cursor-pointer flex-col gap-2 rounded-xl border border-border/50 bg-card-soft p-3 transition-colors hover:border-border">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase" style={{ color: green }}>
          <span>{t(lang, "dr.quote")} · {t(lang, "dr.quoteByAgent")}</span>
          {typeof draft.quoteTotal === "number" ? <span>${draft.quoteTotal.toFixed(2)}</span> : null}
        </div>
        {(draft.quoteItems ?? []).slice(0, 3).map((l, i) => <p key={i} className="truncate text-xs text-foreground">{l.quantity} x {l.description}</p>)}
        <span className="text-[10px] font-semibold text-muted-foreground">{t(lang, "dr.readMore")}</span>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button type="button" disabled={busy} onClick={() => void act(true)} className="chip flex-1 font-bold text-white disabled:opacity-50" style={{ background: "hsl(var(--success))" }}>{t(lang, "dr.sign")}</button>
          <button type="button" disabled={busy} onClick={() => void act(false)} className="chip flex-1 font-bold disabled:opacity-50" style={{ color: "hsl(0 72% 55%)", borderColor: "hsl(0 72% 55%)" }}>{t(lang, "dr.reject")}</button>
        </div>
      </div>
      {preview ? <QuoteProposalPreview lang={lang} draft={draft} onClose={() => setPreview(false)} /> : null}
      {sendId ? <QuoteSendModal lang={lang} quoteId={sendId} contactId={draft.quoteContactId ?? ""} clientName={draft.contactName ?? ""} total={draft.quoteTotal ?? 0} currency="USD" onClose={() => { setSendId(null); onDone(); }} /> : null}
    </>
  );
}
