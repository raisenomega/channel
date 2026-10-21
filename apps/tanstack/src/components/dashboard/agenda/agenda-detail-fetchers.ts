/**
 * HUB by Raisen — Datos relacionados de una cita para el modal (oro puro).
 */
import { restGet, enc } from "./agenda-rest";
import type { ApptContact, ApptConversation, ApptAgent, ApptNote, ApptDoc } from "./agenda-types";

export function fetchApptContact(id: string): Promise<ApptContact[]> {
  return restGet(`contacts?id=eq.${enc(id)}&select=id,display_name,first_name,last_name,primary_phone,primary_email,segment`);
}
export function fetchApptConversation(id: string): Promise<ApptConversation[]> {
  return restGet(`conversations?id=eq.${enc(id)}&select=id,primary_channel,status,sla_violated,operation_mode,subject`);
}
export function fetchApptAgent(id: string): Promise<ApptAgent[]> {
  return restGet(`agents?id=eq.${enc(id)}&select=id,display_name,agent_type,role`);
}
export function fetchApptNotes(contactId: string): Promise<ApptNote[]> {
  return restGet(`contact_notes?contact_id=eq.${enc(contactId)}&select=id,note,created_at&order=created_at.desc&limit=20`);
}
export function fetchApptDocs(conversationId: string): Promise<ApptDoc[]> {
  return restGet(`attachments?conversation_id=eq.${enc(conversationId)}&select=id,file_name,file_type,created_at&order=created_at.desc&limit=20`);
}
