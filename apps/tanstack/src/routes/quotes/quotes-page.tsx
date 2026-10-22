/**
 * HUB by Raisen — Pagina de Cotizaciones (componente principal). Solo cotizaciones reales a clientes.
 */
import { useState } from "react";
import { usePreferences } from "@/app/preferences";
import type { QuoteListItem } from "@/lib/quotes-client";
import { useQuotesData } from "./quotes-fetchers";
import { QuoteCard } from "./quotes-card";
import { LoadingState, EmptyState } from "./quotes-states";
import { QuoteEditorModal } from "./quote-editor-modal";
import { QuotesHeader } from "./quotes-header";
import { QuotePdfModal } from "./pdf/quote-pdf-modal";
import { QuotesTemplateBanner } from "./quotes-template-banner";

export function QuotesPage() {
  const { language } = usePreferences();
  const [showCreate, setShowCreate] = useState(false);
  const [pdfQuote, setPdfQuote] = useState<QuoteListItem | null>(null);
  const { quotes, isPending, contacts, refetch } = useQuotesData();

  const onSaved = (id: string, preview: boolean, contactId: string, currency: string, total: number) => {
    setShowCreate(false);
    void refetch();
    if (preview) setPdfQuote({ id, contactId, status: "draft", totalAmount: total, currency, createdAt: new Date().toISOString(), expiresAt: null });
  };
  const handlePdf = (quote: QuoteListItem) => setPdfQuote(quote);

  return (
    <div className="view space-y-4">
      <QuotesHeader language={language} onCreate={() => setShowCreate(true)} />
      <QuotesTemplateBanner lang={language} />

      {isPending ? (
        <LoadingState language={language} />
      ) : !quotes || quotes.length === 0 ? (
        <EmptyState language={language} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {quotes.map((q) => (
            <QuoteCard key={q.id} quote={q} language={language} onPdf={handlePdf} />
          ))}
        </div>
      )}

      {showCreate && <QuoteEditorModal lang={language} contacts={contacts ?? []} onClose={() => setShowCreate(false)} onSaved={onSaved} />}
      {pdfQuote && <QuotePdfModal lang={language} quote={pdfQuote} contactName={contacts?.find((c) => c.id === pdfQuote.contactId)?.displayName ?? "-"} onClose={() => setPdfQuote(null)} />}
    </div>
  );
}
