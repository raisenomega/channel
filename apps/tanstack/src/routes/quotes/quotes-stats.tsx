/**
 * HUB by Raisen — 4 tarjetas KPI de Cotizaciones (espejo de Reportes): cantidad guardadas, total
 * cotizado, conversion a pagada, precision promedio. Datos reales; "—" honesto donde aun no hay
 * (conversion/precision llegan con ordenes/pagos en F2c · cero sinteticos). C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { Kpi } from "@/components/ui/kpi";
import type { QuoteListItem } from "@/lib/quotes-client";

export function QuotesStats({ lang, quotes }: { lang: Idioma; quotes: QuoteListItem[] }) {
  const count = quotes.length;
  const total = quotes.reduce((s, q) => s + q.totalAmount, 0);
  const currency = quotes[0]?.currency ?? "USD";
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Kpi label={t(lang, "quotes.stats.count")} value={String(count)} />
      <Kpi label={t(lang, "quotes.stats.total")} value={`${currency} ${total.toFixed(2)}`} />
      <Kpi label={t(lang, "quotes.stats.conversion")} value="—" />
      <Kpi label={t(lang, "quotes.stats.wasCorrect")} value="—" />
    </div>
  );
}
