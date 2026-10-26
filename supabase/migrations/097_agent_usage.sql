-- HUB by Raisen — 097: agent_usage. Costo/tokens REAL por respuesta IA (model + cache_read para verificar
-- el prompt caching y el ruteo Haiku/Sonnet, y medir costo real). Service-role escribe; RLS on sin policy.
CREATE TABLE IF NOT EXISTS public.agent_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  conversation_id uuid,
  persona_slug text,
  model text NOT NULL,
  tokens_input integer NOT NULL DEFAULT 0,
  tokens_output integer NOT NULL DEFAULT 0,
  cache_read integer NOT NULL DEFAULT 0,
  cache_creation integer NOT NULL DEFAULT 0,
  cost_usd numeric(12,6) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_usage_tenant_created_idx ON public.agent_usage (tenant_id, created_at DESC);
ALTER TABLE public.agent_usage ENABLE ROW LEVEL SECURITY;
