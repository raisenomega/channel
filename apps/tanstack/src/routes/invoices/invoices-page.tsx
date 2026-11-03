/**
 * HUB by Raisen — Pagina de Facturas (espejo de QuotesPage): 4 KPIs + filas. Clic en una fila la reabre
 * para editar (mismo editor que canales); el boton Descargar abre el PDF FACTURA. Las facturas nacen al
 * convertir una cotizacion, no se crean aqui. C4 <=75.
 */
import { useState } from "react";
import { usePreferences } from "@/app/preferences";
import type { InvoiceListItem } from "@/lib/invoices-client";
import type { QuoteLine } from "@/lib/quotes-client";
import type { ClientData } from "@/routes/quotes/quote-client-fields";
import { useInvoicesData } from "./invoices-fetchers";
import { InvoiceRow } from "./invoice-row";
import { InvoicesStats } from "./invoices-stats";
import { LoadingState, EmptyState } from "./invoices-states";
import { InvoicesHeader } from "./invoices-header";
import { InvoicePdfModal } from "@/routes/quotes/pdf/invoice-pdf-modal";
import { InvoiceEditorModal } from "@/routes/quotes/invoice-editor-modal";
import { RowList } from "@/components/ui/row-list";
import { fetchInvoiceDoc, fetchInvoiceLines } from "@/lib/invoices-edit-client";

type Edit = { inv: InvoiceListItem; client: ClientData; lines: QuoteLine[] };

export function InvoicesPage() {
  const { language } = usePreferences();
  const [pdf, setPdf] = useState<InvoiceListItem | null>(null);
  const [edit, setEdit] = useState<Edit | null>(null);
  const { invoices, isPending, contacts, refetch } = useInvoicesData();
  const nameOf = (inv: InvoiceListItem): string => inv.clientName || contacts?.find((c) => c.id === inv.contactId)?.displayName || "—";
  const openEdit = async (inv: InvoiceListItem) => {
    const [doc, lines] = await Promise.all([fetchInvoiceDoc(inv.id), fetchInvoiceLines(inv.id)]);
    setEdit({ inv, lines, client: { cid: inv.contactId ?? "", name: inv.clientName, service: doc?.service ?? "", phone: doc?.phone ?? "", email: doc?.email ?? "", address: doc?.address ?? "" } });
  };

  return (
    <div className="view space-y-4">
      <InvoicesHeader language={language} />

      {isPending ? (
        <LoadingState language={language} />
      ) : !invoices || invoices.length === 0 ? (
        <EmptyState language={language} />
      ) : (
        <>
          <InvoicesStats lang={language} invoices={invoices} />
          <RowList items={invoices} renderRow={(i) => <InvoiceRow key={i.id} lang={language} invoice={i} contactName={nameOf(i)} onDownload={setPdf} onEdit={(x) => void openEdit(x)} />} />
        </>
      )}

      {pdf && <InvoicePdfModal lang={language} invoiceId={pdf.id} clientName={nameOf(pdf)} total={pdf.total} onClose={() => setPdf(null)} />}
      {edit && <InvoiceEditorModal lang={language} invoiceId={edit.inv.id} contactId={edit.inv.contactId ?? ""} clientName={edit.inv.clientName} initialClient={edit.client} initialLines={edit.lines} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); void refetch(); }} onPreview={() => { setPdf(edit.inv); setEdit(null); }} />}
    </div>
  );
}
