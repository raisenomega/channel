/**
 * HUB by Raisen — Pagina de Cotizaciones (componente principal).
 */
import { useState } from "react";
import { usePreferences } from "@/app/preferences";
import { crearQuote, type QuoteListItem } from "@/lib/quotes-client";
import { useQuotesData } from "./quotes-fetchers";
import { QuoteCard } from "./quotes-card";
import { LoadingState, EmptyState } from "./quotes-states";
import { CreateQuoteModal } from "./quotes-modal";
import { QuotesHeader } from "./quotes-header";
import { QuotePdfModal } from "./pdf/quote-pdf-modal";
import { TemplateDesignerModal } from "./pdf/template-designer-modal";

export function QuotesPage() {
  const { language } = usePreferences();
  const [showCreate, setShowCreate] = useState(false);
  const [formContact, setFormContact] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCurrency, setFormCurrency] = useState("USD");
  const [pdfQuote, setPdfQuote] = useState<QuoteListItem | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);

  const { quotes, isPending, contacts, refetch } = useQuotesData();

  async function handleCreate() {
    if (!formContact || !formAmount) return;
    const r = await crearQuote({
      contact_id: formContact,
      total_amount: parseFloat(formAmount),
      currency: formCurrency,
    });
    if (r.ok) {
      setShowCreate(false);
      setFormContact("");
      setFormAmount("");
      setFormCurrency("USD");
      void refetch();
    }
  }

  const handlePdf = (quote: QuoteListItem) => setPdfQuote(quote);

  return (
    <div className="view space-y-4">
      <QuotesHeader language={language} onCreate={() => setShowCreate(true)} onTemplate={() => setShowTemplate(true)} />

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

      {showCreate ? (
        <CreateQuoteModal
          language={language}
          contacts={contacts ?? []}
          formContact={formContact} setFormContact={setFormContact}
          formAmount={formAmount} setFormAmount={setFormAmount}
          formCurrency={formCurrency} setFormCurrency={setFormCurrency}
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      ) : null}

      {showTemplate && <TemplateDesignerModal lang={language} onClose={() => setShowTemplate(false)} />}
      {pdfQuote && <QuotePdfModal lang={language} quote={pdfQuote} contactName={contacts?.find((c) => c.id === pdfQuote.contactId)?.displayName ?? "-"} onClose={() => setPdfQuote(null)} />}
    </div>
  );
}