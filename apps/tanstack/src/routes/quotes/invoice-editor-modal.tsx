/**
 * HUB by Raisen — Modal para editar una Factura (mismo editor que la cotizacion): cliente + lineas +
 * totales (tax a nivel documento). Guardar actualiza; Vista previa abre el PDF "FACTURA". C4 <=75.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { QuoteLine } from "@/lib/quotes-client";
import { saveInvoiceWithItems } from "@/lib/invoices-edit-client";
import { convertInvoiceToOrder } from "@/lib/invoices-client";
import { fetchBusinessInfo } from "./pdf/pdf-business-info";
import { QuoteLineEditor } from "./quote-line-editor";
import { QuoteClientFields, type ClientData } from "./quote-client-fields";
import { InvoiceSendModal } from "./invoice-send-modal";

export function InvoiceEditorModal({ lang, invoiceId, contactId, clientName, initialClient, initialLines, onClose, onSaved, onPreview }: {
  lang: Idioma; invoiceId: string; contactId: string; clientName: string; initialClient: ClientData; initialLines: QuoteLine[];
  onClose: () => void; onSaved: () => void; onPreview: () => void;
}) {
  const bizQ = useQuery({ queryKey: ["pdf-biz", "row"], queryFn: () => fetchBusinessInfo("row") });
  const tax = bizQ.data?.tax ?? { mode: "pct" as const, value: 0, currency: "USD" };
  const currency = tax.currency;
  const [client, setClient] = useState<ClientData>(initialClient);
  const [lines, setLines] = useState<QuoteLine[]>(initialLines);
  const [busy, setBusy] = useState(false);
  const [send, setSend] = useState(false);
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const taxAmt = tax.mode === "pct" ? subtotal * tax.value / 100 : tax.value;
  const total = subtotal + taxAmt;
  const money = (n: number): string => `${currency} ${n.toFixed(2)}`;
  const save = async (): Promise<boolean> => {
    setBusy(true);
    const id = await saveInvoiceWithItems({ id: invoiceId, clientName: client.name || clientName, clientPhone: client.phone, clientEmail: client.email, clientAddress: client.address, service: client.service, subtotal, taxTotal: taxAmt, total }, lines);
    setBusy(false);
    return !!id;
  };
  const toOrder = async () => {
    setBusy(true);
    const ord = await convertInvoiceToOrder(invoiceId);
    setBusy(false);
    if (ord) onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <Card className="max-h-[92vh] w-full max-w-6xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader><CardTitle>{t(lang, "invoices.editTitle")}</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          <QuoteClientFields lang={lang} contactId={clientName || "inv"} contactName={clientName} contacts={[]} preselect="" initial={initialClient} editing onChange={setClient} />
          <QuoteLineEditor lang={lang} items={lines} currency={currency} onChange={setLines} />
          <div className="space-y-1 border-t border-border/40 pt-2 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>{t(lang, "doc.subtotal")}</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>{t(lang, "doc.taxTotal")}</span><span>{money(taxAmt)}</span></div>
            <div className="flex justify-between font-bold text-foreground"><span>{t(lang, "quotes.total")}</span><span>{money(total)}</span></div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="primary" onClick={() => void save().then((ok) => ok && onSaved())} disabled={busy || lines.length === 0}>{t(lang, "quotes.save")}</Button>
            <Button variant="outline" onClick={() => void save().then((ok) => ok && onPreview())} disabled={busy || lines.length === 0}>{t(lang, "quotes.pdf.preview")}</Button>
            <Button variant="outline" onClick={() => void toOrder()} disabled={busy}>{t(lang, "quotes.convertOrder")}</Button>
            <Button variant="outline" onClick={() => setSend(true)} disabled={busy}>{t(lang, "invoices.send")}</Button>
            <Button variant="ghost" onClick={onClose}>{t(lang, "quotes.cancel")}</Button>
          </div>
        </CardBody>
      </Card>
      {send ? <InvoiceSendModal lang={lang} invoiceId={invoiceId} contactId={contactId} clientName={client.name || clientName} total={total} currency={currency} onClose={() => setSend(false)} /> : null}
    </div>
  );
}
