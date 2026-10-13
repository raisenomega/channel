-- FASE 6 — BC automation: rules engine + SLA + business hours

CREATE TABLE public.automation_rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  trigger     text NOT NULL CHECK (trigger IN ('message_received','conversation_created','conversation_assigned','status_changed','sla_breach','keyword','segment_entered','quote_accepted','order_confirmed','payment_received')),
  conditions  jsonb NOT NULL DEFAULT '{}',
  actions     jsonb NOT NULL DEFAULT '[]',
  is_active   boolean NOT NULL DEFAULT true,
  priority    int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_automation_rules_trigger ON automation_rules(tenant_id, trigger) WHERE is_active = true;
CREATE TRIGGER trg_automation_rules_updated_at BEFORE UPDATE ON automation_rules FOR EACH ROW EXECUTE FUNCTION _set_updated_at();
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_automation" ON automation_rules FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.automation_rule_executions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_id         uuid NOT NULL REFERENCES public.automation_rules(id),
  conversation_id uuid REFERENCES public.conversations(id),
  event_type      text NOT NULL,
  result          text NOT NULL CHECK (result IN ('success','failed','skipped')),
  details         jsonb DEFAULT '{}',
  executed_at     timestamptz NOT NULL DEFAULT now()
) PARTITION BY RANGE (executed_at);
ALTER TABLE public.automation_rule_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_auto_exec" ON automation_rule_executions FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());