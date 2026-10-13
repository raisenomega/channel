/**
 * HUB by Raisen — Tipos compartidos para el frontend TanStack.
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

export interface DashboardStats {
  readonly total: number;
  readonly porCanal: Readonly<Record<string, number>>;
  readonly sinAsignar: number;
  readonly abiertas: number;
  readonly hasChannelsConnected: boolean;
}

export interface Mensaje {
  readonly id: string;
  readonly conversationId: string;
  readonly senderType: "contact" | "agent" | "system";
  readonly senderId: string | null;
  readonly content: string;
  readonly messageType: string;
  readonly createdAt: string;
}

export interface Contact360 {
  readonly contactId: string;
  readonly displayName: string;
  readonly primaryPhone: string | null;
  readonly primaryEmail: string | null;
  readonly segment: string | null;
  readonly ltvUsd: number;
  readonly totalOrders: number;
  readonly preferredChannel: string | null;
  readonly marketingOptIn: boolean;
  readonly doNotContact: boolean;
  readonly conversaciones: readonly { id: string; channel: string; status: string; lastMessageAt: string }[];
  readonly cotizaciones: readonly { id: string; status: string; totalAmount: number; currency: string; createdAt: string }[];
  readonly ordenes: readonly { id: string; status: string; totalAmount: number; currency: string; createdAt: string }[];
  readonly pagos: readonly { id: string; status: string; amount: number; currency: string; createdAt: string }[];
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

export interface RowContact {
  id: string;
  display_name: string | null;
  primary_phone: string | null;
  primary_email: string | null;
  segment: string | null;
  ltv_usd: number | null;
  total_orders: number | null;
  preferred_channel: string | null;
  marketing_opt_in: boolean | null;
  do_not_contact: boolean | null;
}

export interface RowQuote {
  id: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
}

export interface RowOrder {
  id: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
}

export interface RowPayment {
  id: string;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
}

// ── IA Agent ────────────────────────────────────────────────
export interface RowAgentInteraction {
  id: string;
  conversation_id: string;
  was_correct: boolean | null;
  was_distinguishable: boolean | null;
  resolved_autonomously: boolean | null;
  latency_seconds: number | null;
  provider: string | null;
  model: string | null;
  created_at: string;
  tenant_id: string | null;
}

export interface RowSafeEvaluation {
  id: string;
  interaction_id: string;
  decision: "approved" | "blocked" | "abstained";
  disagreement_pct: number | null;
  autonomy_phase: number | null;
  is_kill_switched: boolean | null;
  kill_switch_reason: string | null;
  created_at: string;
  tenant_id: string | null;
}

export interface AgentMetrics {
  wasCorrectPct: number | null;
  indistinguishabilityPct: number | null;
  autoResolvePct: number | null;
  avgLatencyMs: number | null;
  totalInteractions: number;
  providerName: string;
  modelName: string;
  byokConfigured: boolean;
  fallbackProvider: string | null;
}

export type AutonomyPhase = 0 | 1 | 2 | 3 | 4;

export interface SafeStats {
  totalEvaluaciones: number;
  approved: number;
  blocked: number;
  abstained: number;
  disagreementAvgPct: number | null;
  currentPhase: AutonomyPhase;
  isKillSwitched: boolean;
  killSwitchReason: string | null;
  sinDatos: boolean;
}