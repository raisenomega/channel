/**
 * HUB by Raisen — P2: seccion de propuestas de cotizacion del agente en el chip Cotizacion (grid 4/linea).
 * [Aceptar] = crea la cotizacion real + aprueba la propuesta + abre el modal REAL "Editar cotizacion" (el
 * mismo de /quotes) con todo (Guardar/Vista previa=PDF/Enviar/Copiar link/Convertir). [Rechazar] = deniega.
 * C4 <=75.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, resolveTenantId } from "@/lib/api-client";
import type { Idioma } from "@/lib/i18n";
import { listarContactos } from "@/lib/contacts-client";
import type { DraftItem } from "@/hooks/useDraftsPending";
import type { QuoteLine, QuoteListItem } from "@/lib/quotes-client";
import { QuoteEditorModal } from "@/routes/quotes/quote-editor-modal";
import { QuotePdfModal } from "@/routes/quotes/pdf/quote-pdf-modal";
import { firmarCotizacion } from "@/components/dashboard/agents/firmar-cotizacion";
import { AgentQuoteProposal } from "./agent-quote-proposal";

export function QuoteProposalsSection({ lang, propuestas, onChange }: { lang: Idioma; propuestas: DraftItem[]; onChange: () => void }) {
  // MISMO shape/queryFn que useQuotesData (array desempaquetado) para NO chocar la cache ["contacts"] -> rompia /quotes
  const contactsQ = useQuery({ queryKey: ["contacts"], queryFn: async () => { const r = await listarContactos(); return r.ok ? r.value : []; } });
  const contacts = contactsQ.data ?? [];
  const [edit, setEdit] = useState<{ d: DraftItem; qid: string } | null>(null);
  const [pdf, setPdf] = useState<{ q: QuoteListItem; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const draftPath = async (id: string, path: string) => { const tid = resolveTenantId(); if (!tid) return; await apiFetch(`/tenants/${encodeURIComponent(tid)}/drafts/${id}/${path}`, { method: "POST", body: path === "reject" ? JSON.stringify({ reason: "Cotizacion rechazada" }) : "{}" }); };
  const lineas = (d: DraftItem): QuoteLine[] => (d.quoteItems ?? []).map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unit_price, discountPct: 0, lineTotal: l.line_total }));
  const aceptar = async (d: DraftItem) => {
    if (busy) return; setBusy(true);
    const qid = await firmarCotizacion(d);
    if (qid) { await draftPath(d.id, "approve"); setEdit({ d, qid }); }
    setBusy(false);
  };
  const rechazar = async (d: DraftItem) => { await draftPath(d.id, "reject"); onChange(); };
  if (propuestas.length === 0) return null;
  return (
    <>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {propuestas.map((d) => <AgentQuoteProposal key={d.id} lang={lang} draft={d} busy={busy} onAccept={() => void aceptar(d)} onReject={() => void rechazar(d)} />)}
      </div>
      {edit ? <QuoteEditorModal lang={lang} contactId={edit.d.quoteContactId ?? ""} contactName={edit.d.contactName ?? ""} contacts={contacts} editId={edit.qid}
        initialClient={{ cid: edit.d.quoteContactId ?? "", name: edit.d.contactName ?? "", service: "", phone: edit.d.contactPhone ?? "", email: "", address: "" }}
        initialLines={lineas(edit.d)} onConverted={() => { setEdit(null); onChange(); }} onClose={() => { setEdit(null); onChange(); }}
        onSaved={(id, preview, cid, currency, total) => { const name = edit.d.contactName ?? ""; setEdit(null); onChange(); if (preview) setPdf({ q: { id, contactId: cid, status: "draft", totalAmount: total, currency, createdAt: new Date().toISOString(), expiresAt: null, respondedAt: null }, name }); }} /> : null}
      {pdf ? <QuotePdfModal lang={lang} quote={pdf.q} contactName={pdf.name} onClose={() => setPdf(null)} /> : null}
    </>
  );
}
