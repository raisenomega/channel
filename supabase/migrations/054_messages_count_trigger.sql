-- 054_messages_count_trigger.sql
-- Hotfix P Issue A: conversations.total_messages quedaba en 0 y last_message_at sin actualizar.
-- El ingest ya no re-upserta la conversacion (no resetea), pero nada incrementaba el contador.
-- Trigger AFTER INSERT ON messages -> incrementa total_messages + fija last_message_at (el inbox
-- ordena por last_message_at). messages es particionada; un trigger de fila en el padre aplica a
-- todas las particiones (PG 11+).
CREATE OR REPLACE FUNCTION public.bump_conversation_on_message() RETURNS trigger AS $$
BEGIN
  UPDATE public.conversations
     SET total_messages = total_messages + 1,
         last_message_at = NEW.created_at
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_conversation ON public.messages;
CREATE TRIGGER trg_bump_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_on_message();
