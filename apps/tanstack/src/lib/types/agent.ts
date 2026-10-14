/**
 * HUB by Raisen — Tipos del agente IA.
 */

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