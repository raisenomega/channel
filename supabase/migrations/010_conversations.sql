-- FASE 3 — BC inbox: conversations + messages + tags + participants
-- Particionado mensual para messages (pg_partman)

CREATE TABLE public.conversations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id        uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  primary_channel   text NOT NULL
    CHECK (primary_channel IN ('whatsapp','email','instagram','facebook','telegram','sms','x','linkedin','webchat')),
  primary_inbox_id  uuid REFERENCES public.inboxes(id),
  status            text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','pending','snoozed','resolved','archived')),
  status_changed_at timestamptz NOT NULL DEFAULT now(),
  snoozed_until     timestamptz,
  assigned_agent_id uuid REFERENCES public.agents(id),
  assigned_team_id  uuid REFERENCES public.teams(id),
  operation_mode    text NOT NULL DEFAULT 'human'
    CHECK (operation_mode IN ('human','assistant','copilot','autonomous','escalated')),
  subject           text,
  priority          text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  is_starred        boolean NOT NULL DEFAULT false,
  total_messages    int NOT NULL DEFAULT 0,
  ai_messages       int NOT NULL DEFAULT 0,
  human_messages    int NOT NULL DEFAULT 0,
  sla_policy_id     uuid REFERENCES public.sla_policies(id),
  sla_violated      boolean NOT NULL DEFAULT false,
  csat_score        int CHECK (csat_score BETWEEN 1 AND 5),
  sentiment_score   numeric CHECK (sentiment_score BETWEEN -1 AND 1),
  sentiment_trend   text CHECK (sentiment_trend IN ('improving','stable','declining','critical')),
  contact_asked_if_bot    boolean NOT NULL DEFAULT false,
  contact_asked_for_human boolean NOT NULL DEFAULT false,
  avg_indistinguishability_score numeric,
  last_message_at   timestamptz,
  resolved_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_conv_tenant_status ON conversations(tenant_id, status, last_message_at DESC NULLS LAST);
CREATE INDEX idx_conv_assignee ON conversations(assigned_agent_id, status);
CREATE INDEX idx_conv_sla ON conversations(tenant_id, sla_violated) WHERE sla_violated = true;
CREATE TRIGGER trg_conv_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION _set_updated_at();
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_conversations" ON conversations FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());