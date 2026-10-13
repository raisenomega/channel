-- FASE 7 — BC cognition: agente IA multi-proveedor

CREATE TABLE public.agent_interactions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id   uuid NOT NULL REFERENCES public.conversations(id),
  contact_id        uuid NOT NULL REFERENCES public.contacts(id),
  channel           text NOT NULL,
  contact_message   text,
  context           jsonb NOT NULL DEFAULT '{}',
  reasoning         text,
  knowledge_used    uuid[],
  confidence_pre    numeric CHECK (confidence_pre BETWEEN 0 AND 1),
  agent_response    text,
  action_taken      jsonb,
  action_result     jsonb,
  was_correct       boolean,
  correction        text,
  correction_category text CHECK (correction_category IN ('wrong_information','wrong_tone','wrong_action','wrong_recipient','wrong_price','wrong_timing','should_have_escalated','other')),
  correction_source text CHECK (correction_source IN ('human_agent','contact_complaint','safe_evaluation','automated_check')),
  confidence_post   numeric CHECK (confidence_post BETWEEN 0 AND 1),
  contact_perceived_as_human boolean,
  indistinguishability_score numeric,
  disclosed_as_ai   boolean DEFAULT false,
  model             text DEFAULT 'claude-sonnet-4-6',
  tokens_input      int, tokens_output int, latency_ms int, cost_usd numeric,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_interactions_conv ON agent_interactions(tenant_id, conversation_id);
CREATE INDEX idx_agent_interactions_feedback ON agent_interactions(tenant_id, was_correct) WHERE was_correct IS NOT NULL;
ALTER TABLE public.agent_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_agent_interactions" ON agent_interactions FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.agent_knowledge (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category              text NOT NULL CHECK (category IN ('rule','preference','pattern','correction','context','brand_voice','catalog','escalation','benchmark')),
  knowledge             text NOT NULL,
  source                text NOT NULL CHECK (source IN ('interaction','pattern','manual','onboarding','vertical','global','brand_voice')),
  confidence            numeric NOT NULL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  times_applied         int NOT NULL DEFAULT 0,
  times_confirmed       int NOT NULL DEFAULT 0,
  times_corrected       int NOT NULL DEFAULT 0,
  status                text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','superseded','deleted')),
  applies_to_channel    text, applies_to_action text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_knowledge_active ON agent_knowledge(tenant_id, status, category) WHERE status = 'active';
CREATE INDEX idx_agent_knowledge_confidence ON agent_knowledge(tenant_id, confidence DESC) WHERE status = 'active';
ALTER TABLE public.agent_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_agent_knowledge" ON agent_knowledge FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.agent_episodes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id       uuid REFERENCES public.conversations(id),
  contact_id            uuid REFERENCES public.contacts(id),
  episode_type          text NOT NULL CHECK (episode_type IN ('initial_contact','quote_negotiation','order_processing','complaint_resolution','reservation_booking','delivery_tracking','support_ticket','upsell_cross_sell','churn_prevention','retention_success','onboarding_customer','lost_customer','human_escalation','custom')),
  input_state           jsonb NOT NULL, output_state jsonb NOT NULL,
  actions_taken         jsonb NOT NULL DEFAULT '[]',
  outcome               text NOT NULL CHECK (outcome IN ('success','partial','failure','escalated')),
  lessons_learned       text[] DEFAULT '{}',
  was_autonomous        boolean NOT NULL, human_intervention_count int DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE INDEX idx_agent_episodes_type ON agent_episodes(tenant_id, episode_type);
ALTER TABLE public.agent_episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_agent_episodes" ON agent_episodes FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());