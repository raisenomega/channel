-- 080 — Link publico de factura (solo-ver) + "solicitar pago" honesto (sin pasarela: marca
-- invoices.pay_requested_at, el negocio confirma el dinero real). Token 192-bit, en BD solo hash
-- SHA-256, 30d. RPCs anon por token (el token es el candado). Todo por users.tenant_id. SECURITY DEFINER.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS pay_requested_at timestamptz;

CREATE TABLE IF NOT EXISTS public.invoice_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  token_hash text NOT NULL, expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS invoice_tokens_hash_uidx ON public.invoice_tokens(token_hash);
ALTER TABLE public.invoice_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoice_tokens_read ON public.invoice_tokens;
CREATE POLICY invoice_tokens_read ON public.invoice_tokens FOR SELECT USING (tenant_id = current_tenant());

CREATE OR REPLACE FUNCTION public.create_invoice_token(p_invoice_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE _tid uuid; _token text; _exp timestamptz;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL THEN RETURN jsonb_build_object('error', 'no_auth'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.invoices WHERE id = p_invoice_id AND tenant_id = _tid) THEN
    RETURN jsonb_build_object('error', 'not_found'); END IF;
  UPDATE public.invoice_tokens SET expires_at = now() WHERE invoice_id = p_invoice_id AND expires_at > now();
  _token := encode(extensions.gen_random_bytes(24), 'hex'); _exp := now() + interval '30 days';
  INSERT INTO public.invoice_tokens (invoice_id, tenant_id, token_hash, expires_at)
  VALUES (p_invoice_id, _tid, encode(extensions.digest(_token, 'sha256'), 'hex'), _exp);
  RETURN jsonb_build_object('token', _token, 'expires_at', _exp);
END; $$;

CREATE OR REPLACE FUNCTION public._public_get_invoice_by_token(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, extensions AS $$
DECLARE _hash text; _tk public.invoice_tokens%ROWTYPE; _i public.invoices%ROWTYPE; _b jsonb; _nm text;
BEGIN
  _hash := encode(extensions.digest(_token, 'sha256'), 'hex');
  SELECT * INTO _tk FROM public.invoice_tokens WHERE token_hash = _hash;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'not_found'); END IF;
  IF _tk.expires_at <= now() THEN RETURN jsonb_build_object('status', 'expired'); END IF;
  SELECT * INTO _i FROM public.invoices WHERE id = _tk.invoice_id;
  SELECT branding_config, name INTO _b, _nm FROM public.tenants WHERE id = _tk.tenant_id;
  RETURN jsonb_build_object('status', 'valid',
    'invoice', jsonb_build_object('client_name', _i.client_name, 'client_phone', _i.phone,
      'client_email', _i.email, 'client_address', _i.client_address, 'items', coalesce(_i.items, '[]'::jsonb),
      'subtotal', _i.subtotal, 'tax_total', _i.tax, 'total', _i.total, 'service', _i.notes,
      'pay_requested', (_i.pay_requested_at IS NOT NULL)),
    'brand', jsonb_build_object('name', coalesce(_b->'pdf_company'->>'name', _nm, 'HUB'),
      'logo_url', _b->>'logo_url', 'style', coalesce(_b->>'pdf_style', 'clasico')));
END; $$;

CREATE OR REPLACE FUNCTION public._public_invoice_pay(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE _hash text; _tk public.invoice_tokens%ROWTYPE;
BEGIN
  _hash := encode(extensions.digest(_token, 'sha256'), 'hex');
  SELECT * INTO _tk FROM public.invoice_tokens WHERE token_hash = _hash;
  IF NOT FOUND THEN RETURN jsonb_build_object('status', 'not_found'); END IF;
  IF _tk.expires_at <= now() THEN RETURN jsonb_build_object('status', 'expired'); END IF;
  UPDATE public.invoices SET pay_requested_at = coalesce(pay_requested_at, now()) WHERE id = _tk.invoice_id;
  RETURN jsonb_build_object('status', 'ok');
END; $$;

REVOKE ALL ON FUNCTION public.create_invoice_token(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.create_invoice_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public._public_get_invoice_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public._public_invoice_pay(text) TO anon, authenticated;
