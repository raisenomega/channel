-- HUB by Raisen — B8: notas manuales del contacto (max 3, 300 chars c/u) + cascada de temperatura
-- (frio/tibio/caliente/convertido), que el dueno setea a mano y el agente tambien puede asignar.

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS notes jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS temperature text
  CHECK (temperature IN ('frio','tibio','caliente','convertido'));

-- Agrega una nota (recorta a 300 chars; ignora vacias; tope 3). Devuelve el arreglo de notas.
CREATE OR REPLACE FUNCTION public.add_contact_note(p_contact_id uuid, p_note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid; _notes jsonb; _txt text;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  _txt := left(trim(coalesce(p_note, '')), 300);
  IF _tid IS NULL OR _txt = '' THEN RETURN NULL; END IF;
  SELECT notes INTO _notes FROM public.contacts WHERE id = p_contact_id AND tenant_id = _tid;
  IF _notes IS NULL THEN RETURN NULL; END IF;
  IF jsonb_array_length(_notes) >= 3 THEN RETURN _notes; END IF;
  _notes := _notes || jsonb_build_object('text', _txt, 'at', now());
  UPDATE public.contacts SET notes = _notes WHERE id = p_contact_id AND tenant_id = _tid;
  RETURN _notes;
END; $$;

-- Setea la temperatura (frio/tibio/caliente/convertido). Devuelve el valor.
CREATE OR REPLACE FUNCTION public.set_contact_temperature(p_contact_id uuid, p_temp text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid; _t text;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  _t := CASE p_temp WHEN 'frio' THEN 'frio' WHEN 'tibio' THEN 'tibio' WHEN 'caliente' THEN 'caliente' WHEN 'convertido' THEN 'convertido' ELSE NULL END;
  IF _tid IS NULL OR _t IS NULL THEN RETURN NULL; END IF;
  UPDATE public.contacts SET temperature = _t WHERE id = p_contact_id AND tenant_id = _tid;
  RETURN _t;
END; $$;

REVOKE ALL ON FUNCTION public.add_contact_note(uuid, text) FROM public;
REVOKE ALL ON FUNCTION public.set_contact_temperature(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.add_contact_note(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_contact_temperature(uuid, text) TO authenticated;
