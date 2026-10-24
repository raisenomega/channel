-- ============================================================================
-- HUB by Raisen — Migración 087: Lista A — 9 campos nuevos de contexto (incl. Reglas P6)
-- Lo que Victor (CEO Agente) pidió que el dueño defina: promesa de marca, que nunca decir, casos de
-- alto valor, metas del trimestre, y las reglas de enrutamiento/escalamiento. Todos opcionales (text).
-- Idempotente (ADD COLUMN IF NOT EXISTS). Owner aplica + registry + migration repair --status applied 087.
-- ============================================================================
BEGIN;

ALTER TABLE public.tenant_context
  ADD COLUMN IF NOT EXISTS brand_promise text,
  ADD COLUMN IF NOT EXISTS never_say text,
  ADD COLUMN IF NOT EXISTS high_value_cases text,
  ADD COLUMN IF NOT EXISTS quarter_goals text,
  ADD COLUMN IF NOT EXISTS routing_criteria text,
  ADD COLUMN IF NOT EXISTS escalation_triggers text,
  ADD COLUMN IF NOT EXISTS high_risk_cases text,
  ADD COLUMN IF NOT EXISTS never_automate text,
  ADD COLUMN IF NOT EXISTS doubt_threshold text;

COMMENT ON COLUMN public.tenant_context.escalation_triggers IS 'Casos que Victor escala directo al humano (quejas publicas, legal, salud, pagos, prensa).';
COMMENT ON COLUMN public.tenant_context.never_automate IS 'Lo que nunca se automatiza aunque sea posible.';

COMMIT;
