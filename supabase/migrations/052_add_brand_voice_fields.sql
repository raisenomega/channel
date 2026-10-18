-- 052_add_brand_voice_fields.sql
-- S-6 (Compuerta #100): campos de perfil del negocio para el onboarding completo del dashboard.
-- Card Fisicos: street + postal_code (city/region/country_code YA existen en 002_tenants.sql).
-- Card Fiscales: legal_name/tax_id/industry YA existen (0 columnas nuevas aqui).
-- Card Brand Voice & Contexto Operacional: 6 campos que alimentan a Victor + los agentes canonicos
-- + CEREBRO cognition (metrica Was-Correct depende de este contexto).
-- Todas opcionales (NULL permitido; solo `name` es obligatorio — Compuerta #102). CHECK en los
-- dos campos enumerados. ADD COLUMN IF NOT EXISTS = idempotente y no-destructivo.
-- Owner aplica por SQL Editor pre-merge + registry + `supabase migration repair --status applied 052`.

BEGIN;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS brand_tone text
    CHECK (brand_tone IS NULL OR brand_tone IN ('formal', 'casual', 'profesional', 'amigable')),
  ADD COLUMN IF NOT EXISTS brand_services text,
  ADD COLUMN IF NOT EXISTS brand_target_audience text,
  ADD COLUMN IF NOT EXISTS operation_hours text,
  ADD COLUMN IF NOT EXISTS expected_response_sla text
    CHECK (expected_response_sla IS NULL OR expected_response_sla IN ('<1h', '<4h', '<24h', 'best_effort')),
  ADD COLUMN IF NOT EXISTS brand_mission text;

COMMENT ON COLUMN public.tenants.brand_tone IS 'Tono de voz para Victor + agentes IA (CEREBRO cognition).';
COMMENT ON COLUMN public.tenants.brand_services IS 'Servicios/productos principales del negocio (contexto Victor).';
COMMENT ON COLUMN public.tenants.brand_mission IS 'Mision/proposito — alineacion de mensaje + Was-Correct metric.';

COMMIT;
