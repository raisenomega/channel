-- 058_conversations_last_message_preview.sql
-- Hotfix P Bloque 7 (#3): preview REAL del hilo + limpieza de contactos con el nombre del negocio.
--
-- (a) PREVIEW: la lista mostraba un placeholder HARDCODEADO ("Hola, ¿tienen disponibilidad?") porque
--     conversations.subject está null y el front caía a ese texto. El último mensaje real SÍ existe en
--     messages. Fix: columna last_message_preview que el trigger 054 mantiene en cada INSERT (in/out) +
--     backfill del último mensaje real de cada conversación.
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_preview TEXT;

-- Extiende la función del trigger (054) para fijar también el preview. El trigger ya existe y la usa.
CREATE OR REPLACE FUNCTION public.bump_conversation_on_message() RETURNS trigger AS $$
BEGIN
  UPDATE public.conversations
     SET total_messages = total_messages + 1,
         last_message_at = NEW.created_at,
         last_message_preview = NEW.content
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill: el contenido del último mensaje real de cada conversación.
UPDATE public.conversations c SET last_message_preview = sub.content
FROM (
  SELECT DISTINCT ON (conversation_id) conversation_id, content
    FROM public.messages ORDER BY conversation_id, created_at DESC
) sub
WHERE sub.conversation_id = c.id;

-- (b) NOMBRES: los contactos cuyo display_name = el nombre de su negocio (tenant) quedaron mal
--     (mensajes SALIENTES sin nombre del participante cayeron al remitente = el negocio). Es el scope
--     de la sesión, nunca un contacto. Neutral con dato real (teléfono si hay) hasta que llegue el real.
UPDATE public.contacts c SET display_name = COALESCE(NULLIF(c.primary_phone, ''), 'Cliente')
FROM public.tenants t
WHERE t.id = c.tenant_id AND c.display_name = t.name;
