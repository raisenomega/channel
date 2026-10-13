-- FASE 10 — Compliance: consent tracking, auditoria, privacy config

CREATE TABLE public.consent_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id      uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  channel         text NOT NULL CHECK (channel IN ('whatsapp','email','sms','phone','web')),
  action          text NOT NULL CHECK (action IN ('opt_in','opt_out','withdrawn','expired')),
  source          text NOT NULL CHECK (source IN ('explicit','implied','legal_requirement','system')),
  ip_address      inet,
  user_agent      text,
  consented_at    timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz,
  metadata        jsonb DEFAULT '{}'
) PARTITION BY RANGE (consented_at);
CREATE INDEX idx_consent_contact ON consent_log(tenant_id, contact_id, channel);
ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_consent" ON consent_log FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.privacy_config (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  privacy_policy_url text,
  privacy_policy_version text DEFAULT '1.0',
  gdpr_mode       boolean NOT NULL DEFAULT false,
  ccpa_mode       boolean NOT NULL DEFAULT true,
  ai_disclosure   boolean NOT NULL DEFAULT false,
  ai_disclosure_text text DEFAULT 'Este mensaje fue generado por un asistente de IA. Puedes pedir hablar con una persona en cualquier momento.',
  data_retention_days int NOT NULL DEFAULT 30,
  audit_retention_years int NOT NULL DEFAULT 3,
  allow_data_export boolean NOT NULL DEFAULT true,
  require_opt_in_for text[] DEFAULT '{}',
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.privacy_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_privacy_config" ON privacy_config FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());