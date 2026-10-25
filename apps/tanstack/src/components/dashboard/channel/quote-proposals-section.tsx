/**
 * HUB by Raisen — P2: propuestas de cotizacion del agente (grid 4/linea). Clic en la tarjeta ABRE el modal
 * real "Editar cotizacion" como WORKSPACE: persiste pase lo que pase (Vista previa NO lo cierra), solo la [X]
 * del modal lo cierra, y la tarjeta solo desaparece con [Aceptar]/[Rechazar]. Nada se auto-acepta. C4 <=75.
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
import { AgentQuoteProposal } from "./agent-quote-proposal";

export function QuoteProposalsSection({ lang, propuestas, onChange }: { lang: Idioma; propuestas: DraftItem[]; onChange: () => void }) {
  const contactsQ = useQuery({ queryKey: ["contacts"], queryFn: async () => { const r = await listarContactos(); return r.ok ? r.value : []; } });
  const contacts = contactsQ.data ?? [];
  const [review, setReview] = useState<DraftItem | null>(null);
  const [savedId, setSavedId] = useState<string | undefined>(undefined);
  const [pdf, setPdf] = useState<{ q: QuoteListItem; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const draftPath = async (id: string, path: string) => { const tid = resolveTenantId(); if (!tid || busy) return; setBusy(true); await apiFetch(`/tenants/${encodeURIComponent(tid)}/drafts/${id}/${path}`, { method: "POST", body: path === "reject" ? JSON.stringify({ reason: "Cotizacion rechazada" }) : "{}" }); setBusy(false); onChange(); };
  const abrir = (d: DraftItem) => { setSavedId(undefined); setReview(d); }; // workspace; NO acepta la propuesta
  const lineas = (d: DraftItem): QuoteLine[] => (d.quoteItems ?? []).map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unit_price, discountPct: 0, lineTotal: l.line_total }));
  if (propuestas.length === 0) return null;
  return (
    <>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {propuestas.map((d) => <AgentQuoteProposal key={d.id} lang={lang} draft={d} busy={busy} onOpen={() => abrir(d)} onAccept={() => void draftPath(d.id, "approve")} onReject={() => void draftPath(d.id, "reject")} />)}
      </div>
      {review ? <QuoteEditorModal lang={lang} contactId={review.quoteContactId ?? ""} contactName={review.contactName ?? ""} contacts={contacts} editId={savedId}
        initialClient={{ cid: review.quoteContactId ?? "", name: review.contactName ?? "", service: "", phone: review.contactPhone ?? "", email: "", address: "" }}
        initialLines={lineas(review)} onConverted={() => { setReview(null); onChange(); }} onClose={() => setReview(null)}
        onSaved={(id, preview, cid, currency, total) => { setSavedId(id); onChange(); if (preview) setPdf({ q: { id, contactId: cid, status: "draft", totalAmount: total, currency, createdAt: new Date().toISOString(), expiresAt: null, respondedAt: null }, name: review.contactName ?? "" }); }} /> : null}
      {pdf ? <QuotePdfModal lang={lang} quote={pdf.q} contactName={pdf.name} onClose={() => setPdf(null)} /> : null}
    </>
  );
}
