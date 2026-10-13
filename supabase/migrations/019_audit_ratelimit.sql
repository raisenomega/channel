-- FASE 10 — Audit logs (retencion 3 años) + rate limiting

CREATE TABLE public.audit_logs (
  id              uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_id        uuid,
  actor_type      text CHECK (actor_type IN ('user','ai_agent','system','integration')),
  action          text NOT NULL,
  resource        text NOT NULL,
  resource_id     text,
  details         jsonb DEFAULT '{}',
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (created_at, id)
) PARTITION BY RANGE (created_at);
CREATE INDEX idx_audit_tenant_action ON audit_logs(tenant_id, action, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at DESC) WHERE actor_id IS NOT NULL;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_admin_read" ON audit_logs FOR SELECT USING (is_hub_admin() OR is_superadmin());
-- Solo INSERT permitido (append-only)
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.rate_limit_config (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel         text NOT NULL CHECK (channel IN ('whatsapp','email','sms','api','webhook')),
  max_requests    int NOT NULL DEFAULT 100,
  window_seconds  int NOT NULL DEFAULT 60,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rate_limit_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_rate_limit" ON rate_limit_config FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());