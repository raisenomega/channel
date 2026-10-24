/**
 * HUB by Raisen — Tarjeta de borrador (clic abre el modal con el texto completo). Muestra autor + a quien
 * (Red Social · Nombre) + vista previa + aprobar/denegar rapido. 4 por linea (grid en la pagina). C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import type { DraftItem } from "@/hooks/useDraftsPending";
import { paraCorto } from "./borrador-meta";

export function BorradorCard({ lang, draft, busy, onOpen, onApprove, onReject }: { lang: Idioma; draft: DraftItem; busy: boolean; onOpen: (d: DraftItem) => void; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  return (
    <div onClick={() => onOpen(draft)} className="flex cursor-pointer flex-col gap-2 rounded-xl border border-border/50 bg-card-soft p-3 transition-colors hover:border-border">
      <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase text-muted-foreground">
        <span className="shrink-0">{t(lang, "dr.from")} {t(lang, "agent.name." + draft.personaSlug)}</span>
        <span className="truncate normal-case">{draft.scope === "generic" ? t(lang, "dr.generic") : `${t(lang, "dr.to")} ${paraCorto(draft)}`}</span>
      </div>
      {draft.scope === "opportunity" ? <span className="self-start rounded-full px-2 py-0.5 text-[9px] font-bold uppercase" style={{ background: "hsl(45 90% 55% / 0.2)", color: "hsl(40 85% 48%)" }}>{t(lang, "dr.opportunity")}</span> : null}
      <p className="line-clamp-2 text-[11px] italic text-muted-foreground">{draft.inboundMessage}</p>
      <p className="line-clamp-4 flex-1 whitespace-pre-wrap text-sm text-foreground">{draft.draftContent}</p>
      <span className="text-[10px] font-semibold text-muted-foreground">{t(lang, "dr.readMore")}</span>
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button type="button" disabled={busy} onClick={() => onApprove(draft.id)} className="chip flex-1 font-bold text-white disabled:opacity-50" style={{ background: "hsl(var(--success))" }}>{t(lang, "dr.approve")}</button>
        <button type="button" disabled={busy} onClick={() => onReject(draft.id)} className="chip flex-1 font-bold disabled:opacity-50" style={{ color: "hsl(0 72% 55%)", borderColor: "hsl(0 72% 55%)" }}>{t(lang, "dr.reject")}</button>
      </div>
    </div>
  );
}
