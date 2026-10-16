-- Slide 4.9 — WhatsApp Templates (bank-grade). Tabla de plantillas Meta WABA gestionadas via Zernio.
-- Fuente: brief Slide 4.9 §3. UNIQUE (tenant_id, name, language) = namespace por tenant (R20).
create table if not exists whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  language text not null,
  category text not null check (category in ('utility','marketing','authentication')),
  body text not null,
  header_type text,
  header_content text,
  footer text,
  buttons jsonb,
  status text not null default 'pending_create'
    check (status in ('pending_create','pending_meta','approved','rejected','paused','disabled','error')),
  zernio_template_id text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name, language)
);

create index if not exists idx_whatsapp_templates_tenant on whatsapp_templates(tenant_id);
create index if not exists idx_whatsapp_templates_status on whatsapp_templates(status);

alter table whatsapp_templates enable row level security;

drop policy if exists "tenant_scope" on whatsapp_templates;
create policy "tenant_scope" on whatsapp_templates
  for select to authenticated
  using (tenant_id::text = (auth.jwt() ->> 'tenant_id'));
