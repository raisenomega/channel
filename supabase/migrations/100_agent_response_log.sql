-- HUB by Raisen — 100: agent_response_log. Registro del resultado de CADA respuesta del agente por inbound
-- (respondio/no_send/error + razon + intentos). Cierra la ceguera del fire-and-forget. Service-role; RLS on.
CREATE TABLE IF NOT EXISTS public.agent_response_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  conversation_id uuid,
  channel text,
  outcome text NOT NULL,
  reason text,
  intentos integer NOT NULL DEFAULT 0,
  inbound text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_response_log_tenant_created_idx ON public.agent_response_log (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_response_log_outcome_idx ON public.agent_response_log (outcome, created_at DESC);
ALTER TABLE public.agent_response_log ENABLE ROW LEVEL SECURITY;
