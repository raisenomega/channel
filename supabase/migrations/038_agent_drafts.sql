-- ============================================================================
-- HUB by Raisen — Migracion 038: agent_drafts (Slide 4.2b-1)
-- Tabla de drafts supervisados con RLS por tenant_id.
-- Idempotencia por (tenant_id, conversation_id, inbound_message_hash).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  persona_slug TEXT NOT NULL CHECK (persona_slug IN ('victor','zahra','thao','iris','eco','angel','kelsy')),
  inbound_message TEXT NOT NULL,
  inbound_message_hash TEXT NOT NULL,
  draft_content TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','rejected','sent','expired')),
  ai_disclosure_included BOOLEAN NOT NULL DEFAULT FALSE,
  trace_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, conversation_id, inbound_message_hash)
);

CREATE INDEX IF NOT EXISTS agent_drafts_tenant_pending ON public.agent_drafts (tenant_id, status) WHERE status = 'draft';
CREATE INDEX IF NOT EXISTS agent_drafts_expiracion ON public.agent_drafts (status, created_at) WHERE status = 'draft';

ALTER TABLE public.agent_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_drafts_tenant_isolation ON public.agent_drafts
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

COMMENT ON TABLE public.agent_drafts IS 'Drafts supervisados del agente IA pendientes de aprobacion humana.';
-- ============================================================================
-- FIN Migracion 038
-- ============================================================================