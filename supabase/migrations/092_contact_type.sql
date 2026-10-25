-- HUB by Raisen — CRM: TIPO de contacto (persona/empresa) SEPARADO del segmento de valor (General/Nuevo/
-- Regular/VIP). Ademas alinea el RPC create_contact: inserta los valores nuevos del segmento (antes mapeaba
-- nuevo->new_lead, rompiendo los contactos del form) y agrega p_type.

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS contact_type text
  CHECK (contact_type IN ('persona','empresa')) DEFAULT 'persona';

DROP FUNCTION IF EXISTS public.create_contact(text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.create_contact(p_name text, p_phone text, p_email text, p_segment text, p_address text, p_type text DEFAULT 'persona')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _tid uuid; _seg text; _type text; _id uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL OR coalesce(trim(p_name), '') = '' THEN RETURN NULL; END IF;
  _seg := CASE p_segment WHEN 'nuevo' THEN 'nuevo' WHEN 'regular' THEN 'regular' WHEN 'vip' THEN 'vip' ELSE 'general' END;
  _type := CASE p_type WHEN 'empresa' THEN 'empresa' ELSE 'persona' END;
  INSERT INTO public.contacts (tenant_id, display_name, primary_phone, primary_email, segment, address, contact_type)
  VALUES (_tid, trim(p_name), nullif(p_phone, ''), nullif(p_email, ''), _seg, nullif(p_address, ''), _type)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_contact(text, text, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_contact(text, text, text, text, text, text) TO authenticated;
