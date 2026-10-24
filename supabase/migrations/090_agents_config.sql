-- ============================================================================
-- HUB by Raisen — Migración 090 (S7a): configuración por negocio de los agentes + modo 'autonomous'.
-- (1) tenants.agents_config jsonb: umbral de confianza, capacidades autorizadas (cada toggle = firma del
--     dueno), que siempre va a revision, horario/dias, tope diario, canales. {} = usar defaults seguros.
-- (2) agents_autodraft gana 'autonomous' (envia solo, gated por la config). Sigue default 'off' = seguro.
-- Idempotente / no-destructivo. Owner aplica + registry + migration repair --status applied 090.
-- ============================================================================
BEGIN;

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS agents_config jsonb NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.tenants.agents_config IS 'Config S7 de los agentes: confidence, capacidades (can), revision (review), horario, tope, canales. Cada capacidad ON = firma aprobada del dueno.';

ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_agents_autodraft_check;
ALTER TABLE public.tenants ADD CONSTRAINT tenants_agents_autodraft_check
  CHECK (agents_autodraft IN ('off', 'supervised', 'autonomous'));

COMMIT;
