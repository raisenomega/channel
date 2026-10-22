-- 073 — La cotizacion guarda datos del cliente (client_name/phone/email/address) + servicio/producto
-- general (en notes) para el PDF. save_quote_with_items los persiste; get_quote_doc los lee
-- determinista (users.tenant_id de auth.uid(), como get_quote_items) para que el PDF los muestre.
CREATE OR REPLACE FUNCTION public.save_quote_with_items(p_quote jsonb, p_items jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _tid uuid := current_tenant(); _id uuid;
BEGIN
  IF _tid IS NULL THEN RETURN NULL; END IF;
  _id := nullif(p_quote->>'id', '')::uuid;
  IF _id IS NULL THEN
    INSERT INTO public.quotes (tenant_id, contact_id, status, currency, items, subtotal, tax_total, total,
      total_amount, client_name, client_phone, client_email, client_address, notes)
    VALUES (_tid, nullif(p_quote->>'contact_id', '')::uuid, coalesce(p_quote->>'status', 'draft'),
      coalesce(p_quote->>'currency', 'USD'), p_items, (p_quote->>'subtotal')::numeric,
      (p_quote->>'tax_total')::numeric, (p_quote->>'total')::numeric, (p_quote->>'total')::numeric,
      p_quote->>'client_name', p_quote->>'client_phone', p_quote->>'client_email',
      p_quote->>'client_address', p_quote->>'service')
    RETURNING id INTO _id;
  ELSE
    UPDATE public.quotes SET contact_id = nullif(p_quote->>'contact_id', '')::uuid,
      currency = coalesce(p_quote->>'currency', 'USD'), items = p_items,
      subtotal = (p_quote->>'subtotal')::numeric, tax_total = (p_quote->>'tax_total')::numeric,
      total = (p_quote->>'total')::numeric, total_amount = (p_quote->>'total')::numeric,
      client_name = p_quote->>'client_name', client_phone = p_quote->>'client_phone',
      client_email = p_quote->>'client_email', client_address = p_quote->>'client_address',
      notes = p_quote->>'service'
    WHERE id = _id AND tenant_id = _tid;
    IF NOT FOUND THEN RETURN NULL; END IF;
  END IF;
  DELETE FROM public.quote_line_items WHERE quote_id = _id;
  INSERT INTO public.quote_line_items (tenant_id, quote_id, description, quantity, unit_price, discount_pct, line_total, sort)
  SELECT _tid, _id, e->>'description', (e->>'quantity')::numeric, (e->>'unit_price')::numeric,
         coalesce((e->>'discount_pct')::numeric, 0), (e->>'line_total')::numeric, (ord::int - 1)
  FROM jsonb_array_elements(p_items) WITH ORDINALITY AS t(e, ord);
  RETURN _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_quote_doc(p_quote_id uuid)
RETURNS TABLE (client_name text, client_phone text, client_email text, client_address text, service text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT q.client_name, q.client_phone, q.client_email, q.client_address, q.notes
  FROM public.quotes q
  JOIN public.users u ON u.id = auth.uid()
  WHERE q.id = p_quote_id AND q.tenant_id = u.tenant_id;
$$;

REVOKE ALL ON FUNCTION public.get_quote_doc(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_quote_doc(uuid) TO authenticated;
