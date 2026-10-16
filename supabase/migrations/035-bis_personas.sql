-- ============================================================================
-- HUB by Raisen — Migración 035-bis: personas (fix drift Hotfix I)
-- Tabla global de personas IA (no tenant-scoped). Idempotente.
-- Dependencia de 040 (seed thao). Debe aplicarse ANTES de 040.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  role text NOT NULL,
  default_for text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personas_name ON public.personas(name);

ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

-- RLS: personas son GLOBALES raisen (no tenant-scoped). Solo lectura authenticated.
DROP POLICY IF EXISTS personas_read_all ON public.personas;
CREATE POLICY personas_read_all ON public.personas
  FOR SELECT TO authenticated USING (true);

COMMENT ON TABLE public.personas IS
  'Personas IA globales raisen (victor, zahra, thao, iris, eco, angel, kelsy). No tenant-scoped.';
-- ============================================================================
-- FIN Migración 035-bis_personas
-- ============================================================================
