/**
 * HUB by Raisen — Pestana "Factura" del panel de canal: facturas del contacto como filas (RowList
 * global). Clic en una fila la abre para editar (mismo editor que cotizacion); Vista previa = PDF
 * FACTURA. Las facturas se crean al convertir una cotizacion. C4 <=75.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchInvoicesForContact, type InvoiceListItem } from "@/lib/invoices-client";
import { fetchInvoiceDoc, fetchInvoiceLines } from "@/lib/invoices-edit-client";
import type { QuoteLine } from "@/lib/quotes-client";
import type { ClientData } from "@/routes/quotes/quote-client-fields";
import { InvoiceEditorModal } from "@/routes/quotes/invoice-editor-modal";
import { InvoicePdfModal } from "@/routes/quotes/pdf/invoice-pdf-modal";
import { RowList } from "@/components/ui/row-list";

type Edit = { inv: InvoiceListItem; client: ClientData; lines: QuoteLine[] };

export function ChannelInvoiceTab({ lang, contactId }: { lang: Idioma; contactId: string }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["invoices-contact", contactId], queryFn: () => fetchInvoicesForContact(contactId), enabled: !!contactId, staleTime: 20_000 });
  const [edit, setEdit] = useState<Edit | null>(null);
  const [pdf, setPdf] = useState<InvoiceListItem | null>(null);
  const rows = q.data ?? [];
  const open = async (inv: InvoiceListItem) => {
    const [doc, lines] = await Promise.all([fetchInvoiceDoc(inv.id), fetchInvoiceLines(inv.id)]);
    setEdit({ inv, lines, client: { cid: "", name: inv.clientName, service: doc?.service ?? "", phone: doc?.phone ?? "", email: doc?.email ?? "", address: doc?.address ?? "" } });
  };
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day: "2-digit", month: "short" });
  return (
    <>
      {rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{t(lang, "invoices.empty")}</p> : (
        <RowList items={rows} renderRow={(i) => (
          <div key={i.id} onClick={() => void open(i)} className="flex w-full cursor-pointer items-center gap-3 border-b border-border/30 px-3 py-2 hover:bg-muted/30">
            <span className="w-16 shrink-0 text-xs text-muted-foreground">{fmt(i.createdAt)}</span>
            <span className="flex-1 truncate text-sm font-medium text-foreground">{i.clientName || "—"}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{i.total.toFixed(2)}</span>
            <span className="shrink-0 text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>{t(lang, "invoices.status." + i.status)}</span>
            <button type="button" onClick={(e) => { e.stopPropagation(); setPdf(i); }} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label={t(lang, "quotes.download")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            </button>
          </div>
        )} />
      )}
      {edit && <InvoiceEditorModal lang={lang} invoiceId={edit.inv.id} clientName={edit.inv.clientName} initialClient={edit.client} initialLines={edit.lines} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); void qc.invalidateQueries({ queryKey: ["invoices-contact"] }); }} onPreview={() => { setPdf(edit.inv); setEdit(null); }} />}
      {pdf && <InvoicePdfModal lang={lang} invoiceId={pdf.id} clientName={pdf.clientName} total={pdf.total} onClose={() => setPdf(null)} />}
    </>
  );
}
