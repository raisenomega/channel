-- FASE 4 — Tablas auxiliares de BC contacts

CREATE TABLE public.contact_channels (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  channel_type text NOT NULL CHECK (channel_type IN ('whatsapp','email','instagram','facebook','telegram','sms','x','linkedin','webchat')),
  identifier  text NOT NULL,
  identifier_normalized text NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  is_primary  boolean NOT NULL DEFAULT false,
  channel_metadata jsonb DEFAULT '{}',
  opted_in_at timestamptz, opted_out_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, channel_type, identifier_normalized)
);
CREATE INDEX idx_contact_channels_contact ON contact_channels(contact_id);
CREATE INDEX idx_contact_channels_lookup ON contact_channels(tenant_id, channel_type, identifier_normalized);
ALTER TABLE public.contact_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_contact_channels" ON contact_channels FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.contact_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  author_id  uuid NOT NULL REFERENCES public.users(id),
  note       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_contact_notes" ON contact_notes FOR ALL USING (EXISTS (SELECT 1 FROM contacts c WHERE c.id = contact_id AND c.tenant_id = current_tenant()));

CREATE TABLE public.tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_tags" ON tags FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE TABLE public.contact_tags (
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  applied_by_type text CHECK (applied_by_type IN ('human','ai_agent','system','automation')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contact_id, tag_id)
);
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_contact_tags" ON contact_tags FOR ALL USING (EXISTS (SELECT 1 FROM contacts c WHERE c.id = contact_id AND c.tenant_id = current_tenant()));

CREATE TABLE public.segments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name       text NOT NULL,
  criteria   jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_segments" ON segments FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());