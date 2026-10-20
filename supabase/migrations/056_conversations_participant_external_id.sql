-- 056_conversations_participant_external_id.sql
-- Hotfix P Bloque 5 (Issue #5 / 3o-b): entrega REAL de los mensajes salientes a Zernio.
-- Para responder, Zernio necesita el `to` = id externo del destinatario en la plataforma
-- (conversation.participantId del webhook, ej. el IGSID de Instagram). Hoy no se almacena:
-- el id de la conversación es un UUID determinista que HASHEA ese id externo (no es recuperable).
-- Fix: columna donde el ingest guarda el participantId crudo, y el SendMessageHandler lo usa como `to`.
-- Nullable: las conversaciones viejas quedan en NULL (el ingest las rellena en el próximo inbound).
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS participant_external_id TEXT;
