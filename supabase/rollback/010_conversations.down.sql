-- ROLLBACK 010: Eliminar tabla conversations
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversation_tags CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;