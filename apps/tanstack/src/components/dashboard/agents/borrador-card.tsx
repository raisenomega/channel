/**
 * HUB by Raisen — Tarjeta de un borrador: muestra el mensaje del cliente + la respuesta propuesta, con
 * [checkmark] aprobar y [x] denegar. 4 por linea (el grid lo pone la pagina). C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import type { DraftItem } from "@/hooks/useDraftsPending";

export function BorradorCard({ lang, draft, busy, onApprove, onReject }: { lang: Idioma; draft: DraftItem; busy: boolean; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-card-soft p-3">
      <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase text-muted-foreground">
        <span className="shrink-0">{t(lang, "dr.from")} {t(lang, "agent.name." + draft.personaSlug)}</span>
        <span className="truncate">{draft.scope === "generic" ? t(lang, "dr.generic") : `${t(lang, "dr.to")} ${draft.contactLabel ?? "?"}`}</span>
      </div>
      <p className="line-clamp-2 text-[11px] italic text-muted-foreground">{draft.inboundMessage}</p>
      <p className="line-clamp-5 flex-1 whitespace-pre-wrap text-sm text-foreground">{draft.draftContent}</p>
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={() => onApprove(draft.id)} className="chip flex-1 font-bold text-white disabled:opacity-50" style={{ background: "hsl(var(--success))" }} aria-label="aprobar">{t(lang, "dr.approve")}</button>
        <button type="button" disabled={busy} onClick={() => onReject(draft.id)} className="chip flex-1 font-bold disabled:opacity-50" style={{ color: "hsl(0 72% 55%)", borderColor: "hsl(0 72% 55%)" }} aria-label="denegar">{t(lang, "dr.reject")}</button>
      </div>
    </div>
  );
}
