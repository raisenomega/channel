-- 075 — Convertir cotizacion -> factura (espejo Nucleo convert_quote_to_invoice). invoices no tenia
-- contact_id ni client_address: se agregan para listar facturas por contacto (pestana Factura) y
-- guardar la direccion. convert_quote_to_invoice copia cliente+lineas+totales de la cotizacion a una
-- factura (status draft) y marca la cotizacion convertida. get_invoices_for_contact las lista.
-- Todo por users.tenant_id de auth.uid() (como los demas RPC). SECURITY DEFINER.
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS contact_id uuid;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_address text;

CREATE OR REPLACE FUNCTION public.convert_quote_to_invoice(p_quote_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _tid uuid; _q public.quotes%ROWTYPE; _inv uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO _q FROM public.quotes WHERE id = p_quote_id AND tenant_id = _tid;
  IF _q.id IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.invoices (tenant_id, contact_id, client_name, phone, email, client_address, items, subtotal, tax, total, notes, status)
  VALUES (_tid, _q.contact_id, coalesce(_q.client_name, ''), _q.client_phone, _q.client_email, _q.client_address,
          coalesce(_q.items, '[]'::jsonb), coalesce(_q.subtotal, 0), coalesce(_q.tax_total, 0), coalesce(_q.total, 0), _q.notes, 'draft')
  RETURNING id INTO _inv;
  INSERT INTO public.invoice_line_items (tenant_id, invoice_id, description, quantity, unit_price, discount_pct, line_total, sort)
  SELECT _tid, _inv, description, quantity, unit_price, coalesce(discount_pct, 0), line_total, sort
  FROM public.quote_line_items WHERE quote_id = p_quote_id;
  UPDATE public.quotes SET status = 'converted' WHERE id = p_quote_id;
  RETURN _inv;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_invoices_for_contact(p_contact_id uuid)
RETURNS TABLE (id uuid, client_name text, total numeric, status text, created_at timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT i.id, i.client_name, i.total, i.status, i.created_at
  FROM public.invoices i JOIN public.users u ON u.id = auth.uid()
  WHERE i.contact_id = p_contact_id AND i.tenant_id = u.tenant_id
  ORDER BY i.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.convert_quote_to_invoice(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.convert_quote_to_invoice(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_invoices_for_contact(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_invoices_for_contact(uuid) TO authenticated;
