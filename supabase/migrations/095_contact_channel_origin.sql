-- HUB by Raisen — CRM: la fila del contacto muestra de que red proviene. (1) Backfill de preferred_channel
-- desde el canal de la conversacion mas reciente del contacto. (2) create_contact recibe el canal de origen
-- (p_channel) para los contactos agregados a mano. Los que queden sin canal = "Manual" (lo pinta el front).

-- (1) Backfill: canal de origen = canal de la conversacion mas reciente (solo donde esta vacio).
UPDATE public.contacts c
SET preferred_channel = sub.primary_channel
FROM (
  SELECT DISTINCT ON (contact_id) contact_id, primary_channel
  FROM public.conversations
  ORDER BY contact_id, last_message_at DESC NULLS LAST, created_at DESC
) sub
WHERE c.id = sub.contact_id AND c.preferred_channel IS NULL;

-- (2) create_contact ahora recibe p_channel y lo guarda en preferred_channel. Hay que DROPEAR el de 6 args
-- primero: si no, una llamada de 6 args queda ambigua entre el viejo y el nuevo (p_channel tiene default).
DROP FUNCTION IF EXISTS public.create_contact(text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.create_contact(
  p_name text, p_phone text, p_email text, p_segment text, p_address text,
  p_type text DEFAULT 'persona', p_channel text DEFAULT ''
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid; _seg text; _type text; _ch text; _id uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL OR coalesce(trim(p_name), '') = '' THEN RETURN NULL; END IF;
  _seg := CASE p_segment WHEN 'nuevo' THEN 'nuevo' WHEN 'regular' THEN 'regular' WHEN 'vip' THEN 'vip' ELSE 'general' END;
  _type := CASE p_type WHEN 'empresa' THEN 'empresa' ELSE 'persona' END;
  _ch := CASE p_channel WHEN 'whatsapp' THEN 'whatsapp' WHEN 'instagram' THEN 'instagram' WHEN 'facebook' THEN 'facebook' ELSE NULL END;
  INSERT INTO public.contacts (tenant_id, display_name, primary_phone, primary_email, segment, address, contact_type, preferred_channel)
  VALUES (_tid, trim(p_name), nullif(p_phone, ''), nullif(p_email, ''), _seg, nullif(p_address, ''), _type, _ch)
  RETURNING id INTO _id;
  RETURN _id;
END; $$;

REVOKE ALL ON FUNCTION public.create_contact(text, text, text, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_contact(text, text, text, text, text, text, text) TO authenticated;
