-- HUB by Raisen — B8-3: la nota ahora registra quien la hizo ({text, at, by}) y se puede borrar.
-- add_contact_note pasa a guardar el nombre del operador autenticado; delete_contact_note borra por indice.

CREATE OR REPLACE FUNCTION public.add_contact_note(p_contact_id uuid, p_note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid; _notes jsonb; _txt text; _by text;
BEGIN
  SELECT u.tenant_id, coalesce(nullif(trim(u.display_name), ''), nullif(trim(u.full_name), ''), u.email, 'Operador')
    INTO _tid, _by FROM public.users u WHERE u.id = auth.uid();
  _txt := left(trim(coalesce(p_note, '')), 300);
  IF _tid IS NULL OR _txt = '' THEN RETURN NULL; END IF;
  SELECT notes INTO _notes FROM public.contacts WHERE id = p_contact_id AND tenant_id = _tid;
  IF _notes IS NULL THEN RETURN NULL; END IF;
  IF jsonb_array_length(_notes) >= 3 THEN RETURN _notes; END IF;
  _notes := _notes || jsonb_build_object('text', _txt, 'at', now(), 'by', coalesce(_by, 'Operador'));
  UPDATE public.contacts SET notes = _notes WHERE id = p_contact_id AND tenant_id = _tid;
  RETURN _notes;
END; $$;

-- Borra la nota en la posicion p_index (0-based). Devuelve el arreglo restante.
CREATE OR REPLACE FUNCTION public.delete_contact_note(p_contact_id uuid, p_index int)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid; _notes jsonb;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL OR p_index IS NULL OR p_index < 0 THEN RETURN NULL; END IF;
  SELECT notes INTO _notes FROM public.contacts WHERE id = p_contact_id AND tenant_id = _tid;
  IF _notes IS NULL THEN RETURN NULL; END IF;
  _notes := _notes - p_index;
  UPDATE public.contacts SET notes = _notes WHERE id = p_contact_id AND tenant_id = _tid;
  RETURN _notes;
END; $$;

REVOKE ALL ON FUNCTION public.delete_contact_note(uuid, int) FROM public;
GRANT EXECUTE ON FUNCTION public.delete_contact_note(uuid, int) TO authenticated;
