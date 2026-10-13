-- FASE 8 — Integraciones ecosistema
-- Puentes con NUCLEO, OMEGA, POS, TABLE, HEALTH, HOME, FLEET

CREATE TABLE public.integration_configs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type              text NOT NULL CHECK (type IN ('nucleo','omega','pos','table','health','home','fleet','safe')),
  config            jsonb NOT NULL DEFAULT '{}',
  secrets_encrypted jsonb NOT NULL DEFAULT '{}',
  is_active         boolean NOT NULL DEFAULT true,
  last_sync_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_integration_tenant_type ON integration_configs(tenant_id, type);
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_integrations" ON integration_configs FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.integration_sync_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  integration_id  uuid NOT NULL REFERENCES public.integration_configs(id),
  direction       text NOT NULL CHECK (direction IN ('inbound','outbound')),
  entity          text NOT NULL,
  status          text NOT NULL CHECK (status IN ('success','failed','partial')),
  details         jsonb DEFAULT '{}',
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);
ALTER TABLE public.integration_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_sync_logs" ON integration_sync_logs FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());