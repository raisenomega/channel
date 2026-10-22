/**
 * HUB by Raisen — Selectores relacionados de la cita (cliente, agente, conversacion,
 * cotizacion, factura, documento) que se jalan de lo existente. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { L, INP, type ApptForm } from "./agenda-form-ui";
import type { Opt } from "./agenda-create-data";

export function AgendaCreateRelations({ lang, f, set, onContact, contacts, convs, agents, quotes, orders, docs }: {
  lang: Idioma;
  f: ApptForm;
  set: <K extends keyof ApptForm>(k: K, v: ApptForm[K]) => void;
  onContact: (id: string) => void;
  contacts: Opt[]; convs: Opt[]; agents: Opt[]; quotes: Opt[]; orders: Opt[]; docs: Opt[];
}) {
  const opts = (arr: Opt[]) => arr.map((o) => <option key={o.id} value={o.id}>{o.label}</option>);
  const noC = !f.contactId;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <L label={t(lang, "agenda.d.cliente")}><select className={INP} value={f.contactId} onChange={(e) => onContact(e.target.value)}><option value="">-</option>{opts(contacts)}</select></L>
      <L label={t(lang, "agenda.d.agente")}><select className={INP} value={f.agentId} onChange={(e) => set("agentId", e.target.value)}><option value="">-</option>{opts(agents)}</select></L>
      <L label={t(lang, "agenda.d.conversacion")}><select className={INP} value={f.conversationId} disabled={noC} onChange={(e) => set("conversationId", e.target.value)}><option value="">-</option>{opts(convs)}</select></L>
      <L label={t(lang, "cf.cotizacion")}><select className={INP} value={f.quoteId} disabled={noC} onChange={(e) => set("quoteId", e.target.value)}><option value="">-</option>{opts(quotes)}</select></L>
      <L label={t(lang, "cf.factura")}><select className={INP} value={f.orderId} disabled={noC} onChange={(e) => set("orderId", e.target.value)}><option value="">-</option>{opts(orders)}</select></L>
      <L label={t(lang, "cf.documentos")}><select className={INP} value={f.attachmentId} onChange={(e) => set("attachmentId", e.target.value)}><option value="">-</option>{opts(docs)}</select></L>
    </div>
  );
}
