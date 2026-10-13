-- 3. TABLA tenants — organizaciones (clientes de HUB)
CREATE TABLE public.tenants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,
  legal_name      text,
  tax_id          text,
  industry        text,
  country_code    text NOT NULL DEFAULT 'PR',
  region          text,
  city            text,
  timezone        text NOT NULL DEFAULT 'America/Puerto_Rico',
  default_language text NOT NULL DEFAULT 'es',
  supported_languages text[] NOT NULL DEFAULT ARRAY['es','en'],
  plan            text NOT NULL DEFAULT 'lite_starter'
    CHECK (plan IN ('lite_starter','lite_pro','lite_business','ecosystem','enterprise','inbox_addon')),
  status          text NOT NULL DEFAULT 'active'
    CHECK (status IN ('trial','active','suspended','cancelled','churned')),
  trial_ends_at   timestamptz,
  features_enabled jsonb NOT NULL DEFAULT '{}',
  branding_config jsonb NOT NULL DEFAULT '{}',
  nucleo_tenant_id  uuid, omega_tenant_id uuid, pos_tenant_id uuid,
  meta_business_manager_id text,
  meta_verification_status text DEFAULT 'not_started'
    CHECK (meta_verification_status IN ('pending','verified','rejected','not_started')),
  stripe_customer_id text,
  mrr_usd         numeric,
  churn_risk_score numeric CHECK (churn_risk_score BETWEEN 0 AND 1),
  primary_contact_user_id uuid, billing_contact_user_id uuid,
  onboarded_at    timestamptz,
  last_activity_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  archived_at     timestamptz
);
CREATE INDEX idx_tenants_slug ON tenants(slug) WHERE archived_at IS NULL;
CREATE INDEX idx_tenants_status ON tenants(status) WHERE archived_at IS NULL;
CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenants_read_own" ON tenants FOR SELECT
  USING (id = current_tenant() OR is_superadmin());
CREATE POLICY "tenants_update_own" ON tenants FOR UPDATE
  USING ((id = current_tenant() AND is_hub_owner()) OR is_superadmin())
  WITH CHECK ((id = current_tenant() AND is_hub_owner()) OR is_superadmin());
CREATE POLICY "tenants_insert_superadmin" ON tenants FOR INSERT
  WITH CHECK (is_superadmin());