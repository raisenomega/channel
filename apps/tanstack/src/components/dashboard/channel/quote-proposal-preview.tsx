/**
 * HUB by Raisen — P2: vista previa de la cotizacion que propuso el agente (clic en la tarjeta). Muestra el
 * cliente + tabla de lineas + total, estilo documento. Al Firmar se crea la cotizacion formal. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { DraftItem } from "@/hooks/useDraftsPending";

export function QuoteProposalPreview({ lang, draft, onClose }: { lang: Idioma; draft: DraftItem; onClose: () => void }) {
  const lines = draft.quoteItems ?? [];
  const total = typeof draft.quoteTotal === "number" ? draft.quoteTotal : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <div className="glass-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <h3 className="text-base font-bold text-foreground">{t(lang, "dr.quote")} — {t(lang, "dr.quoteByAgent")}</h3>
          <button type="button" onClick={onClose} className="text-xl text-muted-foreground hover:text-foreground" aria-label="x">{"×"}</button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          <p className="text-sm font-bold text-foreground">{draft.contactName || t(lang, "quotes.contact")}</p>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border/40 text-left text-muted-foreground">
              <th className="py-1">{t(lang, "doc.description")}</th><th className="py-1 text-right">{t(lang, "doc.qty")}</th>
              <th className="py-1 text-right">{t(lang, "doc.price")}</th><th className="py-1 text-right">{t(lang, "doc.total")}</th>
            </tr></thead>
            <tbody>{lines.map((l, i) => (
              <tr key={i} className="border-b border-border/20">
                <td className="py-1 text-foreground">{l.description}</td><td className="py-1 text-right">{l.quantity}</td>
                <td className="py-1 text-right">${l.unit_price.toFixed(2)}</td><td className="py-1 text-right">${l.line_total.toFixed(2)}</td>
              </tr>
            ))}</tbody>
          </table>
          <div className="flex justify-end text-sm font-bold text-foreground">{t(lang, "quotes.total")}: ${total.toFixed(2)}</div>
          {draft.conclusion ? <p className="text-[11px] text-muted-foreground">{draft.conclusion}</p> : null}
        </div>
      </div>
    </div>
  );
}
