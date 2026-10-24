-- ============================================================================
-- HUB by Raisen — Migración 088: FAQ del negocio en el Contexto (B5). Lo llena el dueno en la pagina
-- Contexto; lo leen Thao/Zahra para responder dudas de clientes. Opcional (text). Idempotente.
-- Owner aplica + registry + migration repair --status applied 088.
-- ============================================================================
BEGIN;
ALTER TABLE public.tenant_context ADD COLUMN IF NOT EXISTS faq text;
COMMENT ON COLUMN public.tenant_context.faq IS 'Preguntas frecuentes del negocio + respuestas (contexto para los agentes).';
COMMIT;
