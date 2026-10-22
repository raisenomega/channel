/**
 * HUB by Raisen — Mapeo entre el formulario de cita y el payload / la fila existente.
 */
import type { ApptForm } from "./agenda-form-ui";
import type { ApptPayload } from "./agenda-create";
import type { RowAppointment } from "./agenda-types";

const pad = (n: number): string => String(n).padStart(2, "0");
const dk = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function emptyForm(): ApptForm {
  const d = new Date();
  return {
    title: "", date: dk(d), time: "09:00", status: "scheduled", channel: "", createdBy: "human", meetingType: "in_person",
    contactId: "", conversationId: "", agentId: "", quoteId: "", orderId: "", attachmentId: "",
    description: "", reason: "", preNotes: "", reminders: [], media: [],
  };
}

export function formFromAppt(a: RowAppointment): ApptForm {
  const d = new Date(a.scheduled_at);
  return {
    title: a.title, date: dk(d), time: `${pad(d.getHours())}:${pad(d.getMinutes())}`, status: a.status,
    channel: a.channel ?? "", createdBy: a.created_by_type, meetingType: a.meeting_type || "in_person",
    contactId: a.contact_id ?? "", conversationId: a.conversation_id ?? "", agentId: a.agent_id ?? "",
    quoteId: a.quote_id ?? "", orderId: a.order_id ?? "", attachmentId: a.attachment_id ?? "",
    description: a.description ?? "", reason: a.reason ?? "", preNotes: a.pre_notes ?? "", reminders: a.reminders ?? [], media: a.media ?? [],
  };
}

export function toPayload(f: ApptForm): ApptPayload {
  return {
    title: f.title.trim(), scheduled_at: new Date(`${f.date}T${f.time}`).toISOString(), status: f.status,
    channel: f.channel || null, created_by_type: f.createdBy, contact_id: f.contactId || null,
    conversation_id: f.conversationId || null, agent_id: f.agentId || null, quote_id: f.quoteId || null,
    order_id: f.orderId || null, attachment_id: f.attachmentId || null, description: f.description.trim() || null,
    reason: f.reason.trim() || null, pre_notes: f.preNotes.trim() || null, meeting_type: f.meetingType,
    meeting_url: null, reminders: f.reminders, media: f.media,
  };
}
