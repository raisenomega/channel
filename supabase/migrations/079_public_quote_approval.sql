-- 079 — Aprobacion publica de cotizacion (espejo de Nucleo). El negocio acuna un token; el cliente
-- abre un link publico (sin login) y Acepta/Rechaza; la respuesta vuelve a HUB (estado + factura
-- borrador al aceptar). Seguridad = token aleatorio 192-bit, se guarda SOLO su hash SHA-256;
-- single-use + expira 30d. Las 2 RPC publicas son SECURITY DEFINER con grant a anon (el token es el gate).
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.quote_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  response text CHECK (response IN ('accepted', 'rejected')),
  responded_at timestamptz,
  client_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS quote_approvals_token_hash_uidx ON public.quote_approvals(token_hash);
ALTER TABLE public.quote_approvals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS quote_approvals_read ON public.quote_approvals;
CREATE POLICY quote_approvals_read ON public.quote_approvals FOR SELECT USING (tenant_id = current_tenant());

-- Acuna el token (authenticated). Devuelve {token} en claro UNA vez (en BD solo el hash). Marca enviada.
CREATE OR REPLACE FUNCTION public.create_quote_approval_token(p_quote_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE _tid uuid; _token text; _exp timestamptz;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL THEN RETURN jsonb_build_object('error', 'no_auth'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.quotes WHERE id = p_quote_id AND tenant_id = _tid) THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  UPDATE public.quote_approvals SET expires_at = now()
   WHERE quote_id = p_quote_id AND response IS NULL AND expires_at > now();
  _token := encode(extensions.gen_random_bytes(24), 'hex');
  _exp := now() + interval '30 days';
  INSERT INTO public.quote_approvals (quote_id, tenant_id, token_hash, expires_at)
  VALUES (p_quote_id, _tid, encode(extensions.digest(_token, 'sha256'), 'hex'), _exp);
  UPDATE public.quotes SET status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END, sent_at = now()
   WHERE id = p_quote_id;
  RETURN jsonb_build_object('token', _token, 'expires_at', _exp);
END;
$$;

-- Lectura publica por token (anon). Devuelve la cotizacion + branding, o estado (not_found/expired/used).
CREATE OR REPLACE FUNCTION public._public_get_quote_by_token(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, extensions
AS $$
DECLARE _hash text; _a public.quote_approvals%ROWTYPE; _q public.quotes%ROWTYPE; _b jsonb; _nm text;
BEGIN
  _hash := encode(extensions.digest(_token, 'sha256'), 'hex');
  SELECT * INTO _a FROM public.quote_approvals WHERE token_hash = _hash;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'not_found'); END IF;
  IF _a.expires_at <= now() THEN RETURN jsonb_build_object('status', 'expired'); END IF;
  IF _a.responded_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'used'); END IF;
  SELECT * INTO _q FROM public.quotes WHERE id = _a.quote_id;
  SELECT branding_config, name INTO _b, _nm FROM public.tenants WHERE id = _a.tenant_id;
  RETURN jsonb_build_object('status', 'valid',
    'quote', jsonb_build_object('client_name', _q.client_name, 'client_phone', _q.client_phone,
      'client_email', _q.client_email, 'client_address', _q.client_address, 'items', coalesce(_q.items, '[]'::jsonb),
      'subtotal', _q.subtotal, 'tax_total', _q.tax_total, 'total', _q.total, 'service', _q.notes),
    'brand', jsonb_build_object('name', coalesce(_b->'pdf_company'->>'name', _nm, 'HUB'),
      'logo_url', _b->>'logo_url', 'style', coalesce(_b->>'pdf_style', 'clasico')));
END;
$$;

-- Respuesta publica (anon). Valida token; aceptar -> estado + factura borrador; rechazar -> estado.
CREATE OR REPLACE FUNCTION public._public_quote_respond(_token text, _decision text, _note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE _hash text; _a public.quote_approvals%ROWTYPE; _q public.quotes%ROWTYPE; _inv uuid;
BEGIN
  IF _decision NOT IN ('accepted', 'rejected') THEN RETURN jsonb_build_object('status', 'bad'); END IF;
  _hash := encode(extensions.digest(_token, 'sha256'), 'hex');
  SELECT * INTO _a FROM public.quote_approvals WHERE token_hash = _hash;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'not_found'); END IF;
  IF _a.expires_at <= now() THEN RETURN jsonb_build_object('status', 'expired'); END IF;
  IF _a.responded_at IS NOT NULL THEN RETURN jsonb_build_object('status', 'used'); END IF;
  UPDATE public.quote_approvals SET response = _decision, responded_at = now(),
         client_note = nullif(trim(coalesce(_note, '')), '') WHERE id = _a.id;
  SELECT * INTO _q FROM public.quotes WHERE id = _a.quote_id;
  IF _decision = 'accepted' THEN
    INSERT INTO public.invoices (tenant_id, contact_id, client_name, phone, email, client_address, items, subtotal, tax, total, notes, status)
    VALUES (_a.tenant_id, _q.contact_id, coalesce(_q.client_name, ''), _q.client_phone, _q.client_email, _q.client_address,
            coalesce(_q.items, '[]'::jsonb), coalesce(_q.subtotal, 0), coalesce(_q.tax_total, 0), coalesce(_q.total, 0), _q.notes, 'draft')
    RETURNING id INTO _inv;
    INSERT INTO public.invoice_line_items (tenant_id, invoice_id, description, quantity, unit_price, discount_pct, line_total, sort)
    SELECT _a.tenant_id, _inv, description, quantity, unit_price, coalesce(discount_pct, 0), line_total, sort
    FROM public.quote_line_items WHERE quote_id = _q.id;
    UPDATE public.quotes SET status = 'converted', responded_at = now(), linked_invoice_id = _inv WHERE id = _q.id;
  ELSE
    UPDATE public.quotes SET status = 'rejected', responded_at = now() WHERE id = _q.id;
  END IF;
  RETURN jsonb_build_object('status', 'ok', 'decision', _decision);
END;
$$;

REVOKE ALL ON FUNCTION public.create_quote_approval_token(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.create_quote_approval_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public._public_get_quote_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public._public_quote_respond(text, text, text) TO anon, authenticated;
