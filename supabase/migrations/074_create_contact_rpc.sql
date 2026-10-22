-- 074 — Alta de contacto que SI guarda. El POST directo a contacts fallaba: tenant_id NOT NULL sin
-- default + el segmento de la UI (vip/regular/nuevo/empresa) fuera del CHECK real. RPC create_contact
-- (SECURITY DEFINER) inserta con el tenant del usuario (users.tenant_id de auth.uid(), como los demas
-- RPC) y mapea el segmento al CHECK. Ademas se agrega la columna address (direccion fisica).
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS address text;

CREATE OR REPLACE FUNCTION public.create_contact(p_name text, p_phone text, p_email text, p_segment text, p_address text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _tid uuid; _seg text; _id uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL OR coalesce(trim(p_name), '') = '' THEN RETURN NULL; END IF;
  _seg := CASE p_segment
    WHEN 'nuevo' THEN 'new_lead' WHEN 'regular' THEN 'prospect'
    WHEN 'empresa' THEN 'customer' WHEN 'vip' THEN 'vip' ELSE 'new_lead' END;
  INSERT INTO public.contacts (tenant_id, display_name, primary_phone, primary_email, segment, address)
  VALUES (_tid, trim(p_name), nullif(p_phone, ''), nullif(p_email, ''), _seg, nullif(p_address, ''))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_contact(text, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_contact(text, text, text, text, text) TO authenticated;
