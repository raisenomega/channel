-- ============================================================================
-- HUB by Raisen — Migración 004: BC channels (inboxes + webhook config)
-- Depende de: 001 helpers, 002 tenants. Provee inboxes para conversaciones.
-- ============================================================================

-- 1. INBOXES — canales conectados por proveedor
CREATE TABLE public.inboxes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel_type          text NOT NULL
    CHECK (channel_type IN ('whatsapp','email','instagram','facebook','telegram','sms','x','linkedin','webchat')),
  provider              text NOT NULL
    CHECK (provider IN ('zernio','meta_direct','resend','360dialog','twilio')),
  name                  text NOT NULL,
  is_active             boolean NOT NULL DEFAULT false,
  is_primary_for_channel boolean NOT NULL DEFAULT false,
  sync_status           text NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('connected','disconnected','error','pending')),
  webhook_secret        text,
  meta_phone_number_id  text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, channel_type, name)
);
CREATE INDEX idx_inboxes_tenant_active ON inboxes(tenant_id, is_active);
CREATE TRIGGER trg_inboxes_updated_at BEFORE UPDATE ON inboxes
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE public.inboxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_inboxes" ON inboxes FOR ALL
  USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

-- 2. WEBHOOK_PROVIDER_CONFIGS — credenciales/firma por proveedor
CREATE TABLE public.webhook_provider_configs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  inbox_id           uuid REFERENCES public.inboxes(id) ON DELETE CASCADE,
  provider           text NOT NULL
    CHECK (provider IN ('zernio','meta_direct','resend','360dialog','twilio')),
  webhook_url        text NOT NULL,
  public_key         text,
  secret             text,
  is_verified        boolean NOT NULL DEFAULT false,
  last_webhook_at    timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider)
);
CREATE INDEX idx_webhook_tenant ON webhook_provider_configs(tenant_id);
ALTER TABLE public.webhook_provider_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_webhook_config" ON webhook_provider_configs FOR ALL
  USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());