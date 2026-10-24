-- ============================================================================
-- HUB by Raisen — Migración 089: borradores genéricos + flag de autodraft por negocio.
-- (1) agent_drafts: conversation_id/contact_id pasan a NULLABLE -> permite borradores GENERICOS
--     (plantillas sin contacto, para cualquier cliente). El UNIQUE con NULL no colisiona (NULLs distintos).
-- (2) tenants.agents_autodraft: flag por negocio. off = los agentes NO generan solos; supervised = al
--     entrar un mensaje generan un BORRADOR que el humano aprueba. Apagado por defecto (seguro).
-- Idempotente/no-destructivo. Owner aplica + registry + migration repair --status applied 089.
-- ============================================================================
BEGIN;

ALTER TABLE public.agent_drafts ALTER COLUMN conversation_id DROP NOT NULL;
ALTER TABLE public.agent_drafts ALTER COLUMN contact_id DROP NOT NULL;

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS agents_autodraft text NOT NULL DEFAULT 'off'
  CHECK (agents_autodraft IN ('off', 'supervised'));
COMMENT ON COLUMN public.tenants.agents_autodraft IS 'off = agentes no generan solos; supervised = generan borrador al entrar mensajes (requiere aprobacion humana).';

COMMIT;
