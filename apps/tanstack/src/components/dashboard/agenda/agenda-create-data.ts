/**
 * HUB by Raisen — Carga las listas del formulario de cita (contactos, agentes, documentos,
 * y por contacto: conversaciones, cotizaciones, ordenes). Devuelve opciones {id,label}.
 */
import { useQuery } from "@tanstack/react-query";
import { listarContactos } from "@/lib/contacts-client/functions";
import { fetchAgents, fetchDocuments } from "@/components/dashboard/channel/channel-tab-global-fetchers";
import { fetchQuotesForContact, fetchOrdersForContact } from "@/components/dashboard/channel/channel-tab-contact-fetchers";
import { fetchConvsForContact } from "./agenda-detail-fetchers";

export type Opt = { id: string; label: string };

export function useApptFormData(contactId: string) {
  const contactos = useQuery({ queryKey: ["ag-contacts"], queryFn: listarContactos, staleTime: 60_000 });
  const agentes = useQuery({ queryKey: ["ag-agents"], queryFn: fetchAgents, staleTime: 60_000 });
  const docs = useQuery({ queryKey: ["ag-docs"], queryFn: fetchDocuments, staleTime: 60_000 });
  const convs = useQuery({ queryKey: ["ag-convs", contactId], queryFn: () => fetchConvsForContact(contactId), enabled: !!contactId });
  const quotes = useQuery({ queryKey: ["ag-quotes", contactId], queryFn: () => fetchQuotesForContact(contactId), enabled: !!contactId });
  const orders = useQuery({ queryKey: ["ag-orders", contactId], queryFn: () => fetchOrdersForContact(contactId), enabled: !!contactId });
  const cd = contactos.data;
  const cList = cd && cd.ok ? cd.value : [];
  return {
    contacts: cList.map((c) => ({ id: c.id, label: c.displayName })) as Opt[],
    agents: (agentes.data ?? []).map((a) => ({ id: a.id, label: a.display_name ?? a.id.slice(0, 8) })) as Opt[],
    docs: (docs.data ?? []).map((d) => ({ id: d.id, label: d.file_name ?? d.id.slice(0, 8) })) as Opt[],
    convs: (convs.data ?? []).map((c) => ({ id: c.id, label: c.subject || c.primary_channel || c.id.slice(0, 8) })) as Opt[],
    quotes: (quotes.data ?? []).map((q) => ({ id: q.id, label: `${q.currency} ${q.total_amount} - ${q.status}` })) as Opt[],
    orders: (orders.data ?? []).map((o) => ({ id: o.id, label: `${o.currency} ${o.total_amount} - ${o.status}` })) as Opt[],
  };
}
