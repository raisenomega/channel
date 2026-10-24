-- ============================================================================
-- HUB by Raisen — Migración 086: tenant_context (contexto del negocio p/ agentes)
-- 1 fila por tenant. Alimenta los facts de Victor + los 6 agentes y el sync a CEREBRO.
-- Campos de alta señal que NO viven ya en tenants (industry/brand_* estan en 002/052).
-- Backend usa service-role; RLS = defensa en profundidad (mismo patron agent_drafts).
-- Idempotente (IF NOT EXISTS). Owner aplica + registry + migration repair --status applied 086.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.tenant_context (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  business_what text,
  differentiator text,
  custom_instructions text,
  policies text,
  main_goal text,
  competitors text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tenant_context IS 'Contexto del negocio que leen los agentes IA (facts) + sync a CEREBRO.';
COMMENT ON COLUMN public.tenant_context.custom_instructions IS 'Instrucciones especiales para los agentes (catch-all de mayor senal).';

ALTER TABLE public.tenant_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_context_tenant_isolation ON public.tenant_context
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE TRIGGER trg_tenant_context_updated_at BEFORE UPDATE ON public.tenant_context
  FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

COMMIT;
