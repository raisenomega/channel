/**
 * HUB by Raisen — P2: tarjeta de la cotizacion que PROPUSO el agente, dentro del chip Cotizacion del Inbox.
 * Muestra lineas + total + por que. [Firmar] crea la cotizacion real (aterriza en Cotizaciones) y aprueba el
 * draft; [Descartar] la rechaza. onDone refresca. C4 <=75.
 */
import { useState } from "react";
import { apiFetch, resolveTenantId } from "@/lib/api-client";
import { t, type Idioma } from "@/lib/i18n";
import type { DraftItem } from "@/hooks/useDraftsPending";
import { firmarCotizacion } from "@/components/dashboard/agents/firmar-cotizacion";

export function AgentQuoteProposal({ lang, draft, onDone }: { lang: Idioma; draft: DraftItem; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const act = async (firmar: boolean) => {
    const tid = resolveTenantId();
    if (!tid || busy) return;
    setBusy(true);
    try {
      if (firmar) {
        if (!(await firmarCotizacion(draft))) { setNote(t(lang, "dr.quotefail")); setBusy(false); return; }
        await apiFetch(`/tenants/${encodeURIComponent(tid)}/drafts/${draft.id}/approve`, { method: "POST", body: "{}" });
        setNote(t(lang, "dr.quotedone"));
      } else {
        await apiFetch(`/tenants/${encodeURIComponent(tid)}/drafts/${draft.id}/reject`, { method: "POST", body: JSON.stringify({ reason: "Descartada" }) });
      }
      onDone();
    } catch { /* */ }
    setBusy(false);
  };
  const green = "hsl(145 55% 42%)";
  return (
    <div className="space-y-1.5 rounded-xl border p-3" style={{ borderColor: "hsl(145 60% 45% / 0.4)", background: "hsl(145 60% 45% / 0.06)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase" style={{ color: green }}>{t(lang, "dr.quote")} · {t(lang, "dr.quoteByAgent")}</span>
        {typeof draft.quoteTotal === "number" ? <span className="font-bold" style={{ color: green }}>${draft.quoteTotal.toFixed(2)}</span> : null}
      </div>
      {(draft.quoteItems ?? []).map((l, i) => <p key={i} className="text-xs text-foreground">{l.quantity} x {l.description} — ${l.line_total.toFixed(2)}</p>)}
      {draft.conclusion ? <p className="text-[11px] text-muted-foreground">{draft.conclusion}</p> : null}
      {note ? <p className="text-xs font-semibold text-foreground">{note}</p> : null}
      <div className="flex gap-2 pt-1">
        <button type="button" disabled={busy} onClick={() => void act(true)} className="chip flex-1 font-bold text-white disabled:opacity-50" style={{ background: "hsl(var(--success))" }}>{t(lang, "dr.sign")}</button>
        <button type="button" disabled={busy} onClick={() => void act(false)} className="chip flex-1 font-bold disabled:opacity-50" style={{ color: "hsl(0 72% 55%)", borderColor: "hsl(0 72% 55%)" }}>{t(lang, "dr.reject")}</button>
      </div>
    </div>
  );
}
