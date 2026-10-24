/**
 * HUB by Raisen — Modal centrado: borrador COMPLETO (scroll, sin recorte) + a quien responde (Red Social
 * · Nombre · Telefono) + aprobar/denegar. Clic fuera o x cierra. C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import type { DraftItem } from "@/hooks/useDraftsPending";
import { paraLargo } from "./borrador-meta";

export function BorradorModal({ lang, draft, busy, onClose, onApprove, onReject }: { lang: Idioma; draft: DraftItem; busy: boolean; onClose: () => void; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-3 overflow-hidden rounded-2xl border border-border/50 bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div className="text-xs font-bold uppercase text-muted-foreground">
            <div>{t(lang, "dr.from")} {t(lang, "agent.name." + draft.personaSlug)}</div>
            <div className="mt-0.5 normal-case">{t(lang, "dr.to")} {draft.scope === "generic" ? t(lang, "dr.generic") : paraLargo(draft)}</div>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 text-xl text-muted-foreground hover:text-foreground" aria-label="x">{"×"}</button>
        </div>
        {draft.scope === "opportunity" ? <span className="shrink-0 self-start rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: "hsl(45 90% 55% / 0.2)", color: "hsl(40 85% 48%)" }}>{t(lang, "dr.opportunity")}</span> : null}
        <p className="shrink-0 rounded-lg bg-muted/30 p-2 text-xs italic text-muted-foreground">{draft.inboundMessage}</p>
        <div className="flex-1 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border/40 bg-card-soft p-3 text-sm leading-relaxed text-foreground">{draft.draftContent}</div>
        {draft.autoSendReason && draft.autoSendReason !== "auto-enviado" ? <p className="shrink-0 text-[11px] font-semibold" style={{ color: "hsl(35 85% 48%)" }}>{t(lang, "dr.notsent")}: {draft.autoSendReason}</p> : null}
        <div className="flex shrink-0 gap-2">
          <button type="button" disabled={busy} onClick={() => onApprove(draft.id)} className="chip flex-1 font-bold text-white disabled:opacity-50" style={{ background: "hsl(var(--success))" }}>{t(lang, "dr.approve")}</button>
          <button type="button" disabled={busy} onClick={() => onReject(draft.id)} className="chip flex-1 font-bold disabled:opacity-50" style={{ color: "hsl(0 72% 55%)", borderColor: "hsl(0 72% 55%)" }}>{t(lang, "dr.reject")}</button>
        </div>
      </div>
    </div>
  );
}
