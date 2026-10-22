/**
 * HUB by Raisen — Modal de Cotizacion con lineas (F2a). Si viene contactId (hilo) el contacto queda
 * fijo; si no (cliente nuevo sin hilo) se elige de la lista. Editor de lineas + totales (tax a nivel
 * documento desde la Plantilla) + Guardar/Preview (guarda y abre el PDF). C4 <=75.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { ContactListItem } from "@/lib/contacts-client";
import { saveQuoteWithItems, type QuoteLine } from "@/lib/quotes-client";
import { fetchBusinessInfo } from "./pdf/pdf-business-info";
import { QuoteLineEditor } from "./quote-line-editor";

export function QuoteEditorModal({ lang, contactId, contactName, contacts, onClose, onSaved }: {
  lang: Idioma; contactId: string; contactName: string; contacts: ContactListItem[];
  onClose: () => void; onSaved: (id: string, preview: boolean, contactId: string, currency: string, total: number) => void;
}) {
  const bizQ = useQuery({ queryKey: ["pdf-biz", "row"], queryFn: () => fetchBusinessInfo("row") });
  const tax = bizQ.data?.tax ?? { mode: "pct" as const, value: 0, currency: "USD" };
  const currency = tax.currency;
  const [picked, setPicked] = useState("");
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [busy, setBusy] = useState(false);
  const cid = contactId || picked;
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const taxAmt = tax.mode === "pct" ? subtotal * tax.value / 100 : tax.value;
  const total = subtotal + taxAmt;
  const money = (n: number): string => `${currency} ${n.toFixed(2)}`;
  const persist = async (preview: boolean) => {
    if (!cid || lines.length === 0) return;
    setBusy(true);
    const id = await saveQuoteWithItems({ contactId: cid, currency, subtotal, taxTotal: taxAmt, total }, lines);
    setBusy(false);
    if (id) onSaved(id, preview, cid, currency, total);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <Card className="max-h-[92vh] w-full max-w-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader><CardTitle>{t(lang, "quotes.createTitle")}</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          {contactId ? (
            <div className="rounded-xl border border-border/55 bg-card-soft px-3 py-2 text-sm"><span className="text-muted-foreground">{t(lang, "quotes.contact")}: </span><span className="font-bold text-foreground">{contactName}</span></div>
          ) : (
            <select value={picked} onChange={(e) => setPicked(e.target.value)} className="h-10 w-full rounded-xl border border-border/55 bg-card-soft px-3 text-sm text-foreground">
              <option value="">{t(lang, "quotes.selectContact")}</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
            </select>
          )}
          <QuoteLineEditor lang={lang} items={lines} currency={currency} onChange={setLines} />
          <div className="space-y-1 border-t border-border/40 pt-2 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>{t(lang, "doc.subtotal")}</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>{t(lang, "doc.taxTotal")}</span><span>{money(taxAmt)}</span></div>
            <div className="flex justify-between font-bold text-foreground"><span>{t(lang, "quotes.total")}</span><span>{money(total)}</span></div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="primary" onClick={() => void persist(false)} disabled={busy || !cid || lines.length === 0}>{t(lang, "quotes.save")}</Button>
            <Button variant="outline" onClick={() => void persist(true)} disabled={busy || !cid || lines.length === 0}>{t(lang, "quotes.pdf.preview")}</Button>
            <Button variant="ghost" onClick={onClose}>{t(lang, "quotes.cancel")}</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
