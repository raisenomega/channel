/**
 * HUB by Raisen — Modal "Vista previa PDF" de la Cotizacion. Usa el estilo de plantilla elegido
 * (branding_config.pdf_style) + el documento generico; imprime -> "Guardar como PDF". C4 <=75.
 */
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchMiTenantInfo } from "@/lib/tenant-client/mi-tenant-info";
import { fetchPdfStyle } from "./pdf-style-store";
import { styleOf } from "./pdf-styles";
import { BusinessDocument, type DocRow } from "./business-document";
import { printHtml } from "./pdf-print";
import type { QuoteListItem } from "@/lib/quotes-client";

export function QuotePdfModal({ lang, quote, contactName, onClose }: {
  lang: Idioma; quote: QuoteListItem; contactName: string; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mi = useQuery({ queryKey: ["mi-tenant"], queryFn: fetchMiTenantInfo, staleTime: 300_000 });
  const styleQ = useQuery({ queryKey: ["pdf-style", mi.data?.tenantId], queryFn: () => fetchPdfStyle(mi.data?.tenantId ?? ""), enabled: !!mi.data?.tenantId });
  const bizName = mi.data?.name || "HUB by Raisen";
  const title = t(lang, "quotes.pdf.title");
  const rows: DocRow[] = [
    { label: t(lang, "quotes.contact"), value: contactName },
    { label: t(lang, "quotes.date"), value: new Date(quote.createdAt).toLocaleDateString() },
    { label: t(lang, "quotes.statusLabel"), value: t(lang, "quotes.status." + quote.status) },
    ...(quote.expiresAt ? [{ label: t(lang, "quotes.pdf.expires"), value: new Date(quote.expiresAt).toLocaleDateString() }] : []),
  ];
  const total: DocRow = { label: t(lang, "quotes.total"), value: `${quote.currency} ${quote.totalAmount.toFixed(2)}` };
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
          <div ref={ref}><BusinessDocument title={title} style={styleOf(styleQ.data)} bizName={bizName} refId={quote.id.slice(0, 8)} rows={rows} total={total} /></div>
        </div>
      </div>
    </div>
  );
}
