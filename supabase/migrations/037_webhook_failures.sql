-- ============================================================================
-- HUB by Raisen — Migración: webhook_failures (Slide 4.2a)
-- Dead-letter queue para errores de webhook tras retry agotado.
-- Solo service_role accede (no tenant scope). Idempotente.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  payload JSONB NOT NULL,
  error_kind TEXT NOT NULL,
  error_detail TEXT,
  retries INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_failures_provider ON public.webhook_failures(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_failures_created ON public.webhook_failures(created_at);

ALTER TABLE public.webhook_failures ENABLE ROW LEVEL SECURITY;

-- RLS: solo service_role puede leer/escribir (no tenants)
CREATE POLICY webhook_failures_service_only ON public.webhook_failures
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE public.webhook_failures IS
  'Dead-letter queue de webhooks con retry agotado. Solo accesible via service_role.';

-- ============================================================================
-- FIN Migración webhook_failures
-- ============================================================================