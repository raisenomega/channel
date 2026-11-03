/**
 * HUB by Raisen — 4 KPIs de Facturas (espejo de QuotesStats). Todo dato REAL derivado de la lista: cuantas
 * facturas, total facturado, cuantas pagadas, cuantas pendientes. Cero sinteticos. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { Kpi } from "@/components/ui/kpi";
import type { InvoiceListItem } from "@/lib/invoices-client";

export function InvoicesStats({ lang, invoices }: { lang: Idioma; invoices: InvoiceListItem[] }) {
  const count = invoices.length;
  const total = invoices.reduce((s, i) => s + i.total, 0);
  const paid = invoices.filter((i) => i.status === "paid").length;
  const pending = invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled").length;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Kpi label={t(lang, "invoices.stats.count")} value={String(count)} />
      <Kpi label={t(lang, "invoices.stats.total")} value={`USD ${total.toFixed(2)}`} />
      <Kpi label={t(lang, "invoices.stats.paid")} value={String(paid)} />
      <Kpi label={t(lang, "invoices.stats.pending")} value={String(pending)} />
    </div>
  );
}
