-- 106 — Secuencia COMPARTIDA: factura y orden heredan el MISMO numero de la cotizacion (ZR...).
-- La cotizacion ya numera (084/101: quotes.quote_number = 'ZR00250'). Antes, convert_quote_to_invoice (075)
-- NO copiaba el numero -> invoices.invoice_number quedaba NULL. Ahora la factura hereda ESE numero (la factura
-- es la cotizacion renombrada, mismo numero) y la orden hereda el de la factura. Asi ZR00250 fluye
-- cotizacion -> factura -> orden -> (pago via su orden). Aplicada a prod via SQL Editor (SECURITY DEFINER).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number text;

CREATE OR REPLACE FUNCTION public.convert_quote_to_invoice(p_quote_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid; _q public.quotes%ROWTYPE; _inv uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO _q FROM public.quotes WHERE id = p_quote_id AND tenant_id = _tid;
  IF _q.id IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.invoices (tenant_id, contact_id, invoice_number, client_name, phone, email, client_address, items, subtotal, tax, total, notes, status)
  VALUES (_tid, _q.contact_id, _q.quote_number, coalesce(_q.client_name,''), _q.client_phone, _q.client_email, _q.client_address,
          coalesce(_q.items,'[]'::jsonb), coalesce(_q.subtotal,0), coalesce(_q.tax_total,0), coalesce(_q.total,0), _q.notes, 'draft')
  RETURNING id INTO _inv;
  INSERT INTO public.invoice_line_items (tenant_id, invoice_id, description, quantity, unit_price, discount_pct, line_total, sort)
  SELECT _tid, _inv, description, quantity, unit_price, coalesce(discount_pct,0), line_total, sort
  FROM public.quote_line_items WHERE quote_id = p_quote_id;
  UPDATE public.quotes SET status = 'converted' WHERE id = p_quote_id;
  RETURN _inv;
END; $$;

CREATE OR REPLACE FUNCTION public.create_order_from_invoice(p_invoice_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid; _inv public.invoices%ROWTYPE; _ord uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO _inv FROM public.invoices WHERE id = p_invoice_id AND tenant_id = _tid;
  IF _inv.id IS NULL OR _inv.contact_id IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.orders (tenant_id, contact_id, order_number, status, total_amount, notes)
  VALUES (_tid, _inv.contact_id, _inv.invoice_number, 'pending', coalesce(_inv.total,0), _inv.notes)
  RETURNING id INTO _ord;
  UPDATE public.invoices SET linked_order_id = _ord WHERE id = p_invoice_id;
  RETURN _ord;
END; $$;

GRANT EXECUTE ON FUNCTION public.convert_quote_to_invoice(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_from_invoice(uuid) TO authenticated;
