-- 101 — PDF GLOBAL UNICO para la cotizacion AUTONOMA (agente FB/IG). Hoy el path autonomo inserta directo
-- (service-role) y se salta la numeracion ZR + el membrete, por eso el /q/ sale con hash y sin letterhead.
-- A) numero de secuencia atomico para la autonoma (espejo de save_quote_with_items, por tenant explicito).
-- B) el RPC publico por token ahora devuelve el membrete COMPLETO (tel/email/direccion + footer + terminos)
--    y el quote_number, para que el cliente reciba el MISMO PDF global (RRDD) con su secuencia.

-- A) Asigna el siguiente numero ZR a una cotizacion ya creada. Service-role (tenant explicito). Idempotente.
CREATE OR REPLACE FUNCTION public.assign_quote_number(p_quote_id uuid, p_tenant uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pfx text; _num int; _pad int; _out text; _existing text;
BEGIN
  SELECT quote_number INTO _existing FROM public.quotes WHERE id = p_quote_id AND tenant_id = p_tenant;
  IF _existing IS NOT NULL AND _existing <> '' THEN RETURN _existing; END IF; -- ya numerada: no re-incrementa
  UPDATE public.tenants SET quote_seq_next = quote_seq_next + 1
    WHERE id = p_tenant AND quote_seq_next IS NOT NULL
    RETURNING quote_seq_prefix, quote_seq_next - 1, coalesce(quote_seq_pad, 4) INTO _pfx, _num, _pad;
  IF _num IS NULL THEN RETURN NULL; END IF; -- el negocio no tiene secuencia configurada: se deja sin numero
  _out := coalesce(_pfx, '') || lpad(_num::text, _pad, '0');
  UPDATE public.quotes SET quote_number = _out WHERE id = p_quote_id AND tenant_id = p_tenant;
  RETURN _out;
END; $$;

GRANT EXECUTE ON FUNCTION public.assign_quote_number(uuid, uuid) TO service_role;

-- B) RPC publico por token: mismo contrato, brand ENRIQUECIDO con el membrete real + quote.quote_number.
CREATE OR REPLACE FUNCTION public._public_get_quote_by_token(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, extensions
AS $$
DECLARE _hash text; _a public.quote_approvals%ROWTYPE; _q public.quotes%ROWTYPE; _b jsonb;
        _nm text; _tphone text; _street text; _city text; _region text; _postal text; _addr text;
BEGIN
  _hash := encode(extensions.digest(_token, 'sha256'), 'hex');
  SELECT * INTO _a FROM public.quote_approvals WHERE token_hash = _hash;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'not_found'); END IF;
  IF _a.expires_at <= now() THEN RETURN jsonb_build_object('status', 'expired'); END IF;
  IF _a.responded_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'used'); END IF;
  SELECT * INTO _q FROM public.quotes WHERE id = _a.quote_id;
  SELECT branding_config, name, phone, street, city, region, postal_code
    INTO _b, _nm, _tphone, _street, _city, _region, _postal FROM public.tenants WHERE id = _a.tenant_id;
  _b := coalesce(_b, '{}'::jsonb);
  _addr := coalesce(nullif(_b->'pdf_company'->>'address', ''), nullif(concat_ws(', ', _street, _city, _region, _postal), ''), '');
  RETURN jsonb_build_object('status', 'valid',
    'quote', jsonb_build_object('client_name', _q.client_name, 'client_phone', _q.client_phone,
      'client_email', _q.client_email, 'client_address', _q.client_address, 'items', coalesce(_q.items, '[]'::jsonb),
      'subtotal', _q.subtotal, 'tax_total', _q.tax_total, 'total', _q.total, 'service', _q.notes,
      'quote_number', _q.quote_number),
    'brand', jsonb_build_object('name', coalesce(_b->'pdf_company'->>'name', _nm, 'HUB'),
      'logo_url', _b->>'logo_url', 'style', coalesce(_b->>'pdf_style', 'clasico'),
      'phone', coalesce(_b->'pdf_company'->>'phone', _tphone, ''),
      'email', coalesce(_b->'pdf_company'->>'email', ''),
      'address', _addr,
      'tax', coalesce(_b->'pdf_tax', jsonb_build_object('mode', 'pct', 'value', 0, 'currency', 'USD')),
      'footer1', coalesce(_b->>'pdf_footer1', ''),
      'terms', coalesce(_b->>'pdf_terms', '')));
END;
$$;

GRANT EXECUTE ON FUNCTION public._public_get_quote_by_token(text) TO anon, authenticated;
