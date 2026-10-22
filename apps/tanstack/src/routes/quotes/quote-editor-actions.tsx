/**
 * HUB by Raisen — Botones del editor de cotizacion: Guardar, Vista previa, Copiar link de aprobacion
 * (acuna token + copia el link publico), Convertir a factura y Cancelar. C4 <=75.
 */
import { Button } from "@/components/ui/button";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { convertQuoteToInvoice } from "@/lib/invoices-client";
import { createApprovalToken, approvalLink } from "@/lib/public-quote-client";

export function QuoteEditorActions({ lang, editId, busy, canSave, onSave, onPreview, onSend, onConverted, onClose }: {
  lang: Idioma; editId?: string; busy: boolean; canSave: boolean;
  onSave: () => void; onPreview: () => void; onSend?: () => void; onConverted?: () => void; onClose: () => void;
}) {
  const convert = async () => { if (!editId) return; const inv = await convertQuoteToInvoice(editId); if (inv && onConverted) onConverted(); };
  const copyLink = async () => {
    if (!editId) return;
    const tk = await createApprovalToken(editId);
    if (tk) { await navigator.clipboard.writeText(approvalLink(tk)); window.alert(t(lang, "quotes.linkCopied")); }
  };
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <Button variant="primary" onClick={onSave} disabled={!canSave}>{t(lang, "quotes.save")}</Button>
      <Button variant="outline" onClick={onPreview} disabled={!canSave}>{t(lang, "quotes.pdf.preview")}</Button>
      {editId && onSend ? <Button variant="outline" onClick={onSend} disabled={busy}>{t(lang, "quotes.send")}</Button> : null}
      {editId ? <Button variant="outline" onClick={() => void copyLink()} disabled={busy}>{t(lang, "quotes.copyLink")}</Button> : null}
      {editId ? <Button variant="outline" onClick={() => void convert()} disabled={busy}>{t(lang, "quotes.convertInvoice")}</Button> : null}
      <Button variant="ghost" onClick={onClose}>{t(lang, "quotes.cancel")}</Button>
    </div>
  );
}
