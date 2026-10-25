/**
 * HUB by Raisen — Modal de Cotizacion con lineas (F2a). Datos del cliente (contacto fijo del hilo o
 * elegido + servicio + telefono/email autollenados + direccion de entrega) via QuoteClientFields +
 * editor de lineas + totales (tax a nivel documento) + Guardar/Preview (guarda y abre el PDF). C4 <=75.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { ContactListItem } from "@/lib/contacts-client";
import { saveQuoteWithItems, type QuoteLine } from "@/lib/quotes-client";
import { fetchBusinessInfo } from "./pdf/pdf-business-info";
import { QuoteLineEditor } from "./quote-line-editor";
import { QuoteClientFields, type ClientData } from "./quote-client-fields";
import { QuoteNewContact } from "./quote-new-contact";
import { QuoteEditorActions } from "./quote-editor-actions";
import { QuoteSendModal } from "./quote-send-modal";

const BLANK: ClientData = { cid: "", name: "", service: "", phone: "", email: "", address: "" };

export function QuoteEditorModal({ lang, contactId, contactName, contacts, editId, initialClient, initialLines, onConverted, onClose, onSaved }: {
  lang: Idioma; contactId: string; contactName: string; contacts: ContactListItem[];
  editId?: string; initialClient?: ClientData; initialLines?: QuoteLine[]; onConverted?: () => void;
  onClose: () => void; onSaved: (id: string, preview: boolean, contactId: string, currency: string, total: number) => void;
}) {
  const bizQ = useQuery({ queryKey: ["pdf-biz", "row"], queryFn: () => fetchBusinessInfo("row") });
  const tax = bizQ.data?.tax ?? { mode: "pct" as const, value: 0, currency: "USD" };
  const currency = tax.currency;
  const [client, setClient] = useState<ClientData>(BLANK);
  const [newContact, setNewContact] = useState(false);
  const [preselect, setPreselect] = useState("");
  const [lines, setLines] = useState<QuoteLine[]>(initialLines ?? []);
  const [busy, setBusy] = useState(false);
  const [send, setSend] = useState(false);
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const taxAmt = tax.mode === "pct" ? subtotal * tax.value / 100 : tax.value;
  const total = subtotal + taxAmt;
  const money = (n: number): string => `${currency} ${n.toFixed(2)}`;
  const persist = async (preview: boolean) => {
    if (!client.cid || lines.length === 0) return;
    setBusy(true);
    const id = await saveQuoteWithItems({ id: editId, contactId: client.cid, currency, subtotal, taxTotal: taxAmt, total, clientName: client.name, clientPhone: client.phone, clientEmail: client.email, clientAddress: client.address, service: client.service }, lines);
    setBusy(false);
    if (id) onSaved(id, preview, client.cid, currency, total);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="max-h-[92vh] w-full max-w-6xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader><CardTitle>{t(lang, editId ? "quotes.editTitle" : "quotes.createTitle")}</CardTitle><div className="flex items-center gap-2"><button type="button" className="chip text-xs font-semibold" onClick={() => setNewContact(true)}>+ {t(lang, "quotes.newContact")}</button><button type="button" onClick={onClose} className="text-xl leading-none text-muted-foreground hover:text-foreground" aria-label="x">{"×"}</button></div></CardHeader>
        <CardBody className="space-y-3">
          <QuoteClientFields lang={lang} contactId={contactId} contactName={contactName} contacts={contacts} preselect={preselect} initial={initialClient} editing={!!editId} onChange={setClient} />
          <QuoteLineEditor lang={lang} items={lines} currency={currency} onChange={setLines} />
          <div className="space-y-1 border-t border-border/40 pt-2 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>{t(lang, "doc.subtotal")}</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>{t(lang, "doc.taxTotal")}</span><span>{money(taxAmt)}</span></div>
            <div className="flex justify-between font-bold text-foreground"><span>{t(lang, "quotes.total")}</span><span>{money(total)}</span></div>
          </div>
          <QuoteEditorActions lang={lang} editId={editId} busy={busy} canSave={!busy && !!client.cid && lines.length > 0} onSave={() => void persist(false)} onPreview={() => void persist(true)} onSend={() => setSend(true)} onConverted={onConverted} onClose={onClose} />
        </CardBody>
      </Card>
      {send && editId ? <QuoteSendModal lang={lang} quoteId={editId} contactId={client.cid} clientName={client.name} total={total} currency={currency} onClose={() => setSend(false)} /> : null}
      {newContact && <QuoteNewContact lang={lang} onClose={() => setNewContact(false)} onCreated={(id) => { setNewContact(false); setPreselect(id); }} />}
    </div>
  );
}
