/**
 * HUB by Raisen — Modal "Vista previa PDF" de la Cotizacion (estilo Nucleo): caja cliente + tabla de
 * lineas + totales (tax a nivel documento) + marca de agua. Usa la plantilla configurada. C4 <=75.
 */
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchBusinessInfo, type BizInfo } from "./pdf-business-info";
import { fetchQuoteItems, computeTotals } from "./quote-items";
import { styleOf } from "./pdf-styles";
import { BusinessDocument, type DocLabels } from "./business-document";
import { printHtml } from "./pdf-print";
import type { QuoteListItem } from "@/lib/quotes-client";

const EMPTY: BizInfo = { name: "HUB by Raisen", phone: "", email: "", address: "", logoUrl: null, style: "clasico", tax: { mode: "pct", value: 0, currency: "USD" }, footer1: "", terms: "" };
const WM: Record<string, string> = { draft: "BORRADOR", rejected: "RECHAZADA", expired: "VENCIDA", converted: "CONVERTIDA" };

export function QuotePdfModal({ lang, quote, contactName, onClose }: {
  lang: Idioma; quote: QuoteListItem; contactName: string; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const bizQ = useQuery({ queryKey: ["pdf-biz", "row"], queryFn: () => fetchBusinessInfo("row") });
  const itemsQ = useQuery({ queryKey: ["quote-items", quote.id], queryFn: () => fetchQuoteItems(quote.id), staleTime: 15_000 });
  const biz = bizQ.data ?? EMPTY;
  const items = itemsQ.data ?? [];
  const totals = computeTotals(items, quote.totalAmount, biz.tax);
  const title = t(lang, "quotes.pdf.title");
  const headers = [t(lang, "doc.description"), t(lang, "doc.qty"), t(lang, "doc.price"), t(lang, "doc.total")];
  const labels: DocLabels = { subtotal: t(lang, "doc.subtotal"), tax: t(lang, "doc.taxTotal"), total: t(lang, "quotes.total"), client: t(lang, "quotes.contact"), terms: t(lang, "quotes.tpl.terms") };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <div className="glass-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <h3 className="text-base font-bold text-foreground">{title} - PDF</h3>
          <div className="flex gap-2">
            <button type="button" className="chip font-bold text-white" style={{ background: "hsl(var(--primary))" }} onClick={() => printHtml(ref.current?.outerHTML ?? "", title)}>{t(lang, "quotes.pdf.print")}</button>
            <button type="button" className="chip" onClick={onClose} aria-label={t(lang, "common.back")}>X</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-neutral-300 p-4">
          <div ref={ref}><BusinessDocument title={title} style={styleOf(biz.style)} biz={biz} refId={quote.id.slice(0, 8)} client={{ name: contactName, lines: [] }} items={items} totals={totals} headers={headers} labels={labels} watermark={WM[quote.status]} /></div>
        </div>
      </div>
    </div>
  );
}
