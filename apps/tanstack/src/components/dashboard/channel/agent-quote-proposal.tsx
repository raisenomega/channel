/**
 * HUB by Raisen — P2: tarjeta (estilo Borradores, grid 4/linea) de la cotizacion que propuso el agente.
 * Clic en el CUERPO = abre el modal de edicion (NO acepta, la tarjeta permanece). Solo [Aceptar]/[Rechazar]
 * hacen desaparecer la tarjeta — nunca por clic en otro sitio. C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import type { DraftItem } from "@/hooks/useDraftsPending";

export function AgentQuoteProposal({ lang, draft, busy, onOpen, onAccept, onReject }: {
  lang: Idioma; draft: DraftItem; busy: boolean; onOpen: () => void; onAccept: () => void; onReject: () => void;
}) {
  const green = "hsl(145 55% 42%)";
  return (
    <div onClick={onOpen} className="flex cursor-pointer flex-col gap-2 rounded-xl border border-border/50 bg-card-soft p-3 transition-colors hover:border-border">
      <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase" style={{ color: green }}>
        <span className="truncate">{t(lang, "dr.quote")} · {t(lang, "dr.quoteByAgent")}</span>
        {typeof draft.quoteTotal === "number" ? <span className="shrink-0">${draft.quoteTotal.toFixed(2)}</span> : null}
      </div>
      {draft.clientDecision ? <span className="text-[10px] font-bold" style={{ color: draft.clientDecision === "accepted" ? "hsl(145 55% 42%)" : "hsl(0 72% 55%)" }}>{draft.clientDecision === "accepted" ? t(lang, "dr.clientAccepted") : t(lang, "dr.clientRejected")}</span> : null}
      {draft.conclusion ? <p className="line-clamp-2 text-[11px] text-muted-foreground">{draft.conclusion}</p> : null}
      {(draft.quoteItems ?? []).slice(0, 3).map((l, i) => <p key={i} className="truncate text-xs text-foreground">{l.quantity} x {l.description}</p>)}
      <span className="text-[10px] font-semibold text-muted-foreground">{t(lang, "dr.readMore")}</span>
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button type="button" disabled={busy} onClick={onAccept} className="chip flex-1 font-bold text-white disabled:opacity-50" style={{ background: "hsl(var(--success))" }}>{t(lang, "dr.accept")}</button>
        <button type="button" disabled={busy} onClick={onReject} className="chip flex-1 font-bold disabled:opacity-50" style={{ color: "hsl(0 72% 55%)", borderColor: "hsl(0 72% 55%)" }}>{t(lang, "dr.reject")}</button>
      </div>
    </div>
  );
}
