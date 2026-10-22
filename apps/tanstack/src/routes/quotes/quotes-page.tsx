/**
 * HUB by Raisen — Pagina de Cotizaciones: 4 KPIs + filas. Clic en una fila la reabre para editar
 * (carga su cliente + lineas); el boton Descargar abre el PDF. Crear se hace desde la conversacion.
 */
import { useState } from "react";
import { usePreferences } from "@/app/preferences";
import type { QuoteListItem, QuoteLine } from "@/lib/quotes-client";
import { useQuotesData } from "./quotes-fetchers";
import { QuoteRow } from "./quote-row";
import { QuotesStats } from "./quotes-stats";
import { LoadingState, EmptyState } from "./quotes-states";
import { QuotesHeader } from "./quotes-header";
import { QuotePdfModal } from "./pdf/quote-pdf-modal";
import { QuoteEditorModal } from "./quote-editor-modal";
import { QuotesTemplateBanner } from "./quotes-template-banner";
import { RowList } from "@/components/ui/row-list";
import { fetchQuoteDoc } from "./pdf/quote-doc";
import { fetchQuoteLines } from "./pdf/quote-items";
import type { ClientData } from "./quote-client-fields";

type Edit = { id: string; contactId: string; client: ClientData; lines: QuoteLine[] };

export function QuotesPage() {
  const { language } = usePreferences();
  const [pdfQuote, setPdfQuote] = useState<QuoteListItem | null>(null);
  const [edit, setEdit] = useState<Edit | null>(null);
  const { quotes, isPending, contacts, refetch } = useQuotesData();
  const nameOf = (id: string | null): string => contacts?.find((c) => c.id === id)?.displayName ?? "—";
  const openEdit = async (q: QuoteListItem) => {
    const [doc, lines] = await Promise.all([fetchQuoteDoc(q.id), fetchQuoteLines(q.id)]);
    setEdit({ id: q.id, contactId: q.contactId ?? "", lines, client: { cid: q.contactId ?? "", name: "", service: doc?.service ?? "", phone: doc?.phone ?? "", email: doc?.email ?? "", address: doc?.address ?? "" } });
  };

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
          <RowList items={quotes} renderRow={(q) => <QuoteRow key={q.id} lang={language} quote={q} contactName={nameOf(q.contactId)} onDownload={setPdfQuote} onEdit={(x) => void openEdit(x)} />} />
        </>
      )}

      {pdfQuote && <QuotePdfModal lang={language} quote={pdfQuote} contactName={nameOf(pdfQuote.contactId)} onClose={() => setPdfQuote(null)} />}
      {edit && <QuoteEditorModal lang={language} contactId={edit.contactId} contactName={nameOf(edit.contactId)} contacts={contacts ?? []} editId={edit.id} initialClient={edit.client} initialLines={edit.lines} onConverted={() => { setEdit(null); void refetch(); }} onClose={() => setEdit(null)} onSaved={(id, preview, cid, currency, total) => { setEdit(null); void refetch(); if (preview) setPdfQuote({ id, contactId: cid, status: "draft", totalAmount: total, currency, createdAt: new Date().toISOString(), expiresAt: null, respondedAt: null }); }} />}
    </div>
  );
}
