-- FASE 25 — Templates BC: Plantillas WhatsApp aprobadas por Meta

-- ============================================================
-- whatsapp_templates: plantillas WABA gestionadas por HUB
-- ============================================================
CREATE TABLE public.whatsapp_templates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Identificacion
  name              text NOT NULL,
  language          text NOT NULL DEFAULT 'es',
  category          text NOT NULL CHECK (category IN ('marketing','utility','authentication')),

  -- Contenido estructurado
  header_json       jsonb NOT NULL DEFAULT '{"type":"none","content":null}',
  body              text NOT NULL,
  footer            text,
  buttons_json      jsonb NOT NULL DEFAULT '[]',

  -- Ciclo de vida
  status            text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','pending','approved','rejected','paused','disabled')),
  meta_template_id  text,   -- id devuelto por la API de Meta tras aprobacion
  rejection_reason  text,   -- motivo si Meta rechaza

  -- Auditoria
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_whatsapp_templates_tenant   ON whatsapp_templates(tenant_id);
CREATE INDEX idx_whatsapp_templates_status   ON whatsapp_templates(status);
CREATE UNIQUE INDEX idx_whatsapp_templates_meta_id ON whatsapp_templates(meta_template_id)
  WHERE meta_template_id IS NOT NULL;

-- RLS: aislamiento por tenant
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_wp_templates" ON whatsapp_templates
  FOR ALL
  USING (tenant_id = current_tenant())
  WITH CHECK (tenant_id = current_tenant());

-- ============================================================
-- Trigger: updated_at automatico
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Nota:
--   canned_responses fue creada en 006_sla_bizhours.sql.
--   Este BC 'templates' la consume desde alli (sin duplicar).
-- ============================================================

COMMENT ON TABLE  public.whatsapp_templates IS 'Plantillas WhatsApp aprobadas por Meta. BC: templates';
COMMENT ON COLUMN public.whatsapp_templates.header_json IS 'Tipo y contenido del header: {"type":"text|image|video|document|location|none","content":"..."}';
COMMENT ON COLUMN public.whatsapp_templates.buttons_json IS 'Array de botones: [{type:"url"|"phone_number"|"quick_reply", text:"...", ...}]';
COMMENT ON COLUMN public.whatsapp_templates.status IS 'draft → pending → approved|rejected → paused|disabled';
COMMENT ON COLUMN public.whatsapp_templates.meta_template_id IS 'ID que asigna Meta tras aprobar la plantilla en WABA';