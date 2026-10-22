/**
 * HUB by Raisen — Fila de cotizacion (mismo tamano/estilo que Agendados): fecha + contacto + total +
 * estado + Descargar (abre el PDF). Se pinta dentro de RowList. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { QuoteListItem } from "@/lib/quotes-client";

export function QuoteRow({ lang, quote, contactName, onDownload }: {
  lang: Idioma; quote: QuoteListItem; contactName: string; onDownload: (q: QuoteListItem) => void;
}) {
  const fecha = new Date(quote.createdAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day: "2-digit", month: "short" });
  return (
    <div className="flex w-full items-center gap-3 border-b border-border/30 px-3 py-2">
      <span className="w-16 shrink-0 text-xs text-muted-foreground">{fecha}</span>
      <span className="flex-1 truncate text-sm font-medium text-foreground">{contactName}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{quote.currency} {quote.totalAmount.toFixed(2)}</span>
      <span className="hidden shrink-0 text-xs font-semibold sm:inline" style={{ color: "hsl(var(--primary))" }}>{t(lang, "quotes.status." + quote.status)}</span>
      <button type="button" onClick={() => onDownload(quote)} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label={t(lang, "quotes.download")}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
      </button>
    </div>
  );
}
