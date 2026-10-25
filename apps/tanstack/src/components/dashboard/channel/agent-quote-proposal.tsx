/**
 * HUB by Raisen — P2: tarjeta (mismo estilo/tamano que las de Borradores) de la cotizacion que propuso el
 * agente, en grid 4/linea dentro del chip Cotizacion. Muestra el encabezado honesto + lineas. [Aceptar] abre
 * el modal real "Editar cotizacion"; [Rechazar] la deniega. Solo renderiza; la logica va en la seccion. C4<=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import type { DraftItem } from "@/hooks/useDraftsPending";

export function AgentQuoteProposal({ lang, draft, busy, onAccept, onReject }: {
  lang: Idioma; draft: DraftItem; busy: boolean; onAccept: () => void; onReject: () => void;
}) {
  const green = "hsl(145 55% 42%)";
  return (
    <div onClick={onAccept} className="flex cursor-pointer flex-col gap-2 rounded-xl border border-border/50 bg-card-soft p-3 transition-colors hover:border-border">
      <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase" style={{ color: green }}>
        <span className="truncate">{t(lang, "dr.quote")} · {t(lang, "dr.quoteByAgent")}</span>
        {typeof draft.quoteTotal === "number" ? <span className="shrink-0">${draft.quoteTotal.toFixed(2)}</span> : null}
      </div>
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
