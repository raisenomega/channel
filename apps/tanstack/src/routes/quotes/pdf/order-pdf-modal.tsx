/**
 * HUB by Raisen — Modal "Vista previa PDF" de la Orden (y reusable para el Pago): misma plantilla,
 * label parametrizable (ORDEN / PAGO). Lee cliente + lineas de la orden. C4 <=75.
 */
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchBusinessInfo, type BizInfo } from "./pdf-business-info";
import { computeTotals } from "./quote-items";
import { fetchOrderDoc, fetchOrderLines } from "@/lib/orders-doc-client";
import { styleOf } from "./pdf-styles";
import { BusinessDocument, type DocLabels } from "./business-document";
import { printHtml } from "./pdf-print";

const EMPTY: BizInfo = { name: "HUB by Raisen", phone: "", email: "", address: "", logoUrl: null, style: "clasico", tax: { mode: "pct", value: 0, currency: "USD" }, footer1: "", terms: "" };

export function OrderPdfModal({ lang, orderId, total, title, onClose }: {
  lang: Idioma; orderId: string; total: number; title: string; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const bizQ = useQuery({ queryKey: ["pdf-biz", "row"], queryFn: () => fetchBusinessInfo("row") });
  const linesQ = useQuery({ queryKey: ["ord-lines", orderId], queryFn: () => fetchOrderLines(orderId), staleTime: 15_000 });
  const docQ = useQuery({ queryKey: ["ord-doc", orderId], queryFn: () => fetchOrderDoc(orderId), staleTime: 15_000 });
  const biz = bizQ.data ?? EMPTY;
  const items = (linesQ.data ?? []).map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, lineTotal: l.lineTotal }));
  const totals = computeTotals(items, total, biz.tax);
  const lines = [docQ.data?.service, docQ.data?.phone, docQ.data?.email, docQ.data?.address].filter(Boolean) as string[];
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
          <div ref={ref}><BusinessDocument title={title} style={styleOf(biz.style)} biz={biz} refId={orderId.slice(0, 8)} client={{ name: docQ.data?.name ?? "", lines }} items={items} totals={totals} headers={headers} labels={labels} /></div>
        </div>
      </div>
    </div>
  );
}
