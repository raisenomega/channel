-- FASE 4 — BC contacts (CRM Lite): contactos, canales, notas, tags, segmentos
-- + RLS estricto + búsqueda fuzzy (pg_trgm) + consent tracking

CREATE TABLE public.contacts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  first_name        text,
  last_name         text,
  display_name      text,
  primary_phone     text,
  primary_email     text,
  language          text, timezone text, country_code text, city text, region text,
  segment           text CHECK (segment IN ('new_lead','prospect','customer','recurring','vip','at_risk','churned','blocked')),
  ltv_usd           numeric NOT NULL DEFAULT 0,
  first_purchase_date date, last_purchase_date date,
  total_orders      int NOT NULL DEFAULT 0,
  avg_order_value_usd numeric,
  preferred_channel text, preferred_contact_time jsonb DEFAULT '{}',
  nucleo_customer_id uuid, pos_customer_id uuid,
  external_ids      jsonb DEFAULT '{}',
  custom_attributes jsonb DEFAULT '{}',
  gdpr_consent_at   timestamptz, whatsapp_opt_in_at timestamptz,
  email_opt_in_at   timestamptz, sms_opt_in_at timestamptz,
  marketing_opt_in  boolean NOT NULL DEFAULT false,
  do_not_contact    boolean NOT NULL DEFAULT false,
  ai_context_summary text,
  ai_sentiment_score numeric CHECK (ai_sentiment_score BETWEEN -1 AND 1),
  created_by_source text CHECK (created_by_source IN ('inbound_message','manual','import_csv','nucleo_sync','webchat_form','campaign_response','api')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  archived_at       timestamptz
);
CREATE INDEX idx_contacts_tenant ON contacts(tenant_id) WHERE archived_at IS NULL;
CREATE INDEX idx_contacts_phone ON contacts(tenant_id, primary_phone) WHERE primary_phone IS NOT NULL;
CREATE INDEX idx_contacts_email ON contacts(tenant_id, primary_email) WHERE primary_email IS NOT NULL;
CREATE INDEX idx_contacts_segment ON contacts(tenant_id, segment) WHERE archived_at IS NULL;
CREATE INDEX idx_contacts_ltv ON contacts(tenant_id, ltv_usd DESC) WHERE archived_at IS NULL;
CREATE INDEX idx_contacts_name_trgm ON contacts USING gin(display_name gin_trgm_ops);
CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_contacts" ON contacts FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());