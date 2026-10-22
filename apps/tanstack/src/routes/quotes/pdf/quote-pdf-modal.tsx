/**
 * HUB by Raisen — Modal "Vista previa PDF" de la Cotizacion: muestra el documento en pantalla y
 * el boton Imprimir/Descargar abre la ventana de impresion ("Guardar como PDF"). Sin deps. C4 <=75.
 */
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchMiTenantInfo } from "@/lib/tenant-client/mi-tenant-info";
import { QuoteDocument, type PdfLabels } from "./quote-pdf-doc";
import { printHtml } from "./pdf-print";
import type { QuoteListItem } from "@/lib/quotes-client";

export function QuotePdfModal({ lang, quote, contactName, onClose }: {
  lang: Idioma; quote: QuoteListItem; contactName: string; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mi = useQuery({ queryKey: ["mi-tenant"], queryFn: fetchMiTenantInfo, staleTime: 300_000 });
  const bizName = mi.data?.name || "HUB by Raisen";
  const labels: PdfLabels = {
    title: t(lang, "quotes.pdf.title"), contact: t(lang, "quotes.contact"), date: t(lang, "quotes.date"),
    status: t(lang, "quotes.statusLabel"), statusValue: t(lang, "quotes.status." + quote.status),
    expires: t(lang, "quotes.pdf.expires"), total: t(lang, "quotes.total"), footer: t(lang, "quotes.pdf.footer"),
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <div className="glass-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <h3 className="text-base font-bold text-foreground">{t(lang, "quotes.pdf.title")} - PDF</h3>
          <div className="flex gap-2">
            <button type="button" className="chip font-bold text-white" style={{ background: "hsl(var(--primary))" }} onClick={() => printHtml(ref.current?.outerHTML ?? "", labels.title)}>
              {t(lang, "quotes.pdf.print")}
            </button>
            <button type="button" className="chip" onClick={onClose} aria-label={t(lang, "common.back")}>X</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-neutral-300 p-4">
          <div ref={ref}><QuoteDocument quote={quote} contactName={contactName} bizName={bizName} labels={labels} /></div>
        </div>
      </div>
    </div>
  );
}
