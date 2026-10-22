/**
 * HUB by Raisen — Fila de una cotizacion aterrizada (estilo agendado): contacto + fecha + total +
 * estado + boton Descargar (abre el PDF real). C4 <=75.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { QuoteListItem } from "@/lib/quotes-client";
import { STATUS_TONE } from "./quotes-utils";

export function QuoteRow({ lang, quote, contactName, onDownload }: {
  lang: Idioma; quote: QuoteListItem; contactName: string; onDownload: (q: QuoteListItem) => void;
}) {
  return (
    <div className="glass-card flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-foreground">{contactName}</div>
        <div className="text-xs text-muted-foreground">{new Date(quote.createdAt).toLocaleDateString()} · {quote.currency} {quote.totalAmount.toFixed(2)}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge tone={STATUS_TONE[quote.status] ?? "warn"}>{t(lang, "quotes.status." + quote.status)}</Badge>
        <Button variant="outline" size="sm" onClick={() => onDownload(quote)}>{t(lang, "quotes.download")}</Button>
      </div>
    </div>
  );
}
