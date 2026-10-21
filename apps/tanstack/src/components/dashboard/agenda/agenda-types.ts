/**
 * HUB by Raisen — Tipos de la Agenda (cita + datos relacionados del modal).
 */
export interface RowAppointment {
  id: string;
  contact_id: string | null;
  conversation_id: string | null;
  agent_id: string | null;
  quote_id: string | null;
  order_id: string | null;
  title: string;
  description: string | null;
  scheduled_at: string;
  ends_at: string | null;
  status: string;
  channel: string | null;
  created_by_type: string;
  location: string | null;
}

export interface ApptContact {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  primary_phone: string | null;
  primary_email: string | null;
  segment: string | null;
}

export interface ApptConversation {
  id: string;
  primary_channel: string | null;
  status: string | null;
  sla_violated: boolean | null;
  operation_mode: string | null;
  subject: string | null;
}

export interface ApptAgent {
  id: string;
  display_name: string | null;
  agent_type: string | null;
  role: string | null;
}

export interface ApptNote { id: string; note: string; created_at: string | null; }
export interface ApptDoc { id: string; file_name: string | null; file_type: string | null; created_at: string | null; }
