/**
 * HUB by Raisen — Hook: carga los datos relacionados de una cita (modal).
 * Reusa los fetchers de contacto (cotizaciones/ordenes/pagos). RLS por tenant.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchApptContact, fetchApptConversation, fetchApptAgent, fetchApptNotes, fetchApptDocs } from "./agenda-detail-fetchers";
import { fetchQuotesForContact, fetchOrdersForContact, fetchPaymentsForContact } from "@/components/dashboard/channel/channel-tab-contact-fetchers";
import type { RowAppointment } from "./agenda-types";

export function useApptDetail(appt: RowAppointment) {
  const cid = appt.contact_id;
  const conv = appt.conversation_id;
  const aid = appt.agent_id;
  const contact = useQuery({ queryKey: ["appt-contact", cid], queryFn: () => fetchApptContact(cid as string), enabled: !!cid });
  const conversation = useQuery({ queryKey: ["appt-conv", conv], queryFn: () => fetchApptConversation(conv as string), enabled: !!conv });
  const agent = useQuery({ queryKey: ["appt-agent", aid], queryFn: () => fetchApptAgent(aid as string), enabled: !!aid });
  const notes = useQuery({ queryKey: ["appt-notes", cid], queryFn: () => fetchApptNotes(cid as string), enabled: !!cid });
  const docs = useQuery({ queryKey: ["appt-docs", conv], queryFn: () => fetchApptDocs(conv as string), enabled: !!conv });
  const quotes = useQuery({ queryKey: ["appt-quotes", cid], queryFn: () => fetchQuotesForContact(cid as string), enabled: !!cid });
  const orders = useQuery({ queryKey: ["appt-orders", cid], queryFn: () => fetchOrdersForContact(cid as string), enabled: !!cid });
  const payments = useQuery({ queryKey: ["appt-pays", cid], queryFn: () => fetchPaymentsForContact(cid as string), enabled: !!cid });
  return {
    contact: contact.data?.[0] ?? null,
    conversation: conversation.data?.[0] ?? null,
    agent: agent.data?.[0] ?? null,
    notes: notes.data ?? [],
    docs: docs.data ?? [],
    quotes: quotes.data ?? [],
    orders: orders.data ?? [],
    payments: payments.data ?? [],
  };
}
