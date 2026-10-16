-- ============================================================================
-- HUB by Raisen — Migracion 039: agent_drafts columnas de aprobacion (Slide 4.2b-2)
-- Añade columnas para approve/reject/send/was-correct feedback.
-- Idempotente: ADD COLUMN IF NOT EXISTS.
-- ============================================================================
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_drafts' AND column_name='approved_by') THEN ALTER TABLE public.agent_drafts ADD COLUMN approved_by UUID; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_drafts' AND column_name='approved_at') THEN ALTER TABLE public.agent_drafts ADD COLUMN approved_at TIMESTAMPTZ; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_drafts' AND column_name='rejected_reason') THEN ALTER TABLE public.agent_drafts ADD COLUMN rejected_reason TEXT; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_drafts' AND column_name='sent_at') THEN ALTER TABLE public.agent_drafts ADD COLUMN sent_at TIMESTAMPTZ; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_drafts' AND column_name='provider_message_id') THEN ALTER TABLE public.agent_drafts ADD COLUMN provider_message_id TEXT; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_drafts' AND column_name='was_correct') THEN ALTER TABLE public.agent_drafts ADD COLUMN was_correct BOOLEAN; END IF; END; $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='agent_drafts' AND column_name='feedback_note') THEN ALTER TABLE public.agent_drafts ADD COLUMN feedback_note TEXT; END IF; END; $$;

COMMENT ON COLUMN public.agent_drafts.approved_by IS 'UUID del usuario que aprobo el draft.';
COMMENT ON COLUMN public.agent_drafts.approved_at IS 'Timestamp de aprobacion.';
COMMENT ON COLUMN public.agent_drafts.rejected_reason IS 'Razon de rechazo (min 10 chars).';
COMMENT ON COLUMN public.agent_drafts.sent_at IS 'Timestamp de envio real al cliente.';
COMMENT ON COLUMN public.agent_drafts.provider_message_id IS 'ID del mensaje devuelto por Zernio/WhatsApp tras send.';
COMMENT ON COLUMN public.agent_drafts.was_correct IS 'Feedback post-sent: true=correcta, false=incorrecta.';
COMMENT ON COLUMN public.agent_drafts.feedback_note IS 'Nota opcional del humano sobre la decision.';
-- ============================================================================
-- FIN Migracion 039
-- ============================================================================