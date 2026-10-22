/**
 * HUB by Raisen — Pagina de Cotizaciones: 4 KPIs (espejo de Reportes) + filas aterrizadas con
 * Descargar. Solo cotizaciones reales a clientes; crear se hace desde la conversacion.
 */
import { useState } from "react";
import { usePreferences } from "@/app/preferences";
import type { QuoteListItem } from "@/lib/quotes-client";
import { useQuotesData } from "./quotes-fetchers";
import { QuoteRow } from "./quote-row";
import { QuotesStats } from "./quotes-stats";
import { LoadingState, EmptyState } from "./quotes-states";
import { QuotesHeader } from "./quotes-header";
import { QuotePdfModal } from "./pdf/quote-pdf-modal";
import { QuotesTemplateBanner } from "./quotes-template-banner";
import { RowList } from "@/components/ui/row-list";

export function QuotesPage() {
  const { language } = usePreferences();
  const [pdfQuote, setPdfQuote] = useState<QuoteListItem | null>(null);
  const { quotes, isPending, contacts } = useQuotesData();
  const nameOf = (id: string | null): string => contacts?.find((c) => c.id === id)?.displayName ?? "—";

  return (
    <div className="view space-y-4">
      <QuotesHeader language={language} />
      <QuotesTemplateBanner lang={language} />

      {isPending ? (
        <LoadingState language={language} />
      ) : !quotes || quotes.length === 0 ? (
        <EmptyState language={language} />
      ) : (
        <>
          <QuotesStats lang={language} quotes={quotes} />
          <RowList items={quotes} renderRow={(q) => <QuoteRow key={q.id} lang={language} quote={q} contactName={nameOf(q.contactId)} onDownload={setPdfQuote} />} />
        </>
      )}

      {pdfQuote && <QuotePdfModal lang={language} quote={pdfQuote} contactName={nameOf(pdfQuote.contactId)} onClose={() => setPdfQuote(null)} />}
    </div>
  );
}
