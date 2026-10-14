/**
 * HUB by Raisen — Tipos de inbox.
 */

export interface InboxItem {
  readonly conversationId: string;
  readonly contactId: string | null;
  readonly contactName: string;
  readonly channel: string;
  readonly lastMessage: string;
  readonly lastMessageAt: string;
  readonly unreadCount: number;
  readonly status: string;
  readonly assignedTo: string | null;
  readonly slaViolated: boolean;
  readonly mode: "human" | "assistant" | "copilot" | "autonomous" | "escalated";
}

export interface RowConv {
  id: string;
  contact_id: string | null;
  status: string;
  operation_mode: string | null;
  primary_channel: string | null;
  last_message_at: string | null;
  assigned_agent_id: string | null;
  sla_violated: boolean | null;
  total_messages: number | null;
  subject: string | null;
}

export interface RowMensaje {
  id: string;
  conversation_id: string;
  sender_type: string;
  sender_id: string | null;
  content: string;
  message_type: string;
  created_at: string;
}