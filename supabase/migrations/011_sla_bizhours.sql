-- FASE 6 — SLA policies + business hours + canned responses

CREATE TABLE public.sla_policies (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name                   text NOT NULL,
  first_response_seconds int NOT NULL,
  resolution_seconds     int NOT NULL,
  priority               text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  is_active              boolean NOT NULL DEFAULT true,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_sla" ON sla_policies FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.business_hours (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  inbox_id  uuid REFERENCES public.inboxes(id),
  timezone  text NOT NULL DEFAULT 'America/Puerto_Rico',
  schedule  jsonb NOT NULL DEFAULT '{}',
  holidays  jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_biz_hours" ON business_hours FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.canned_responses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  shortcode  text NOT NULL,
  content    text NOT NULL,
  category   text DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_canned_shortcode ON canned_responses(tenant_id, shortcode);
ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_canned" ON canned_responses FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());