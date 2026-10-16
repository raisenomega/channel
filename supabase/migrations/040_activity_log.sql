-- ============================================================================
-- HUB by Raisen — Migracion 040: activity_log (Slide 4.2a-bis-A)
-- Tabla de log de eventos para el tenant (actividad reciente en Dashboard).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  label TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_tenant ON public.activity_log(tenant_id, created_at DESC);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activity_log_tenant_isolation ON public.activity_log;
CREATE POLICY activity_log_tenant_isolation ON public.activity_log
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

COMMENT ON TABLE public.activity_log IS
  'Log de eventos recientes del tenant para el Dashboard.';

-- Seed thao persona as default WhatsApp draft generator
INSERT INTO public.personas (name, role, default_for)
SELECT 'thao', 'soporte', '{whatsapp}'
WHERE NOT EXISTS (SELECT 1 FROM public.personas WHERE name = 'thao');