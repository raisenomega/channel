-- 076 — Editar factura (espejo de los RPC de cotizacion). save_invoice_with_items actualiza una
-- factura existente (cliente + lineas + totales); get_invoice_doc/get_invoice_items la leen para el
-- editor y el PDF. Todo por users.tenant_id de auth.uid(). SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.save_invoice_with_items(p_invoice jsonb, p_items jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _tid uuid; _id uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL THEN RETURN NULL; END IF;
  _id := nullif(p_invoice->>'id', '')::uuid;
  IF _id IS NULL THEN RETURN NULL; END IF;
  UPDATE public.invoices SET
    client_name = coalesce(p_invoice->>'client_name', ''), phone = p_invoice->>'client_phone',
    email = p_invoice->>'client_email', client_address = p_invoice->>'client_address',
    notes = p_invoice->>'service', items = p_items, subtotal = (p_invoice->>'subtotal')::numeric,
    tax = (p_invoice->>'tax_total')::numeric, total = (p_invoice->>'total')::numeric
  WHERE id = _id AND tenant_id = _tid;
  IF NOT FOUND THEN RETURN NULL; END IF;
  DELETE FROM public.invoice_line_items WHERE invoice_id = _id;
  INSERT INTO public.invoice_line_items (tenant_id, invoice_id, description, quantity, unit_price, discount_pct, line_total, sort)
  SELECT _tid, _id, e->>'description', (e->>'quantity')::numeric, (e->>'unit_price')::numeric,
         coalesce((e->>'discount_pct')::numeric, 0), (e->>'line_total')::numeric, (ord::int - 1)
  FROM jsonb_array_elements(p_items) WITH ORDINALITY AS t(e, ord);
  RETURN _id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_invoice_doc(p_invoice_id uuid)
RETURNS TABLE (client_name text, client_phone text, client_email text, client_address text, service text)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT i.client_name, i.phone, i.email, i.client_address, i.notes
  FROM public.invoices i JOIN public.users u ON u.id = auth.uid()
  WHERE i.id = p_invoice_id AND i.tenant_id = u.tenant_id;
$$;

CREATE OR REPLACE FUNCTION public.get_invoice_items(p_invoice_id uuid)
RETURNS TABLE (description text, quantity numeric, unit_price numeric, discount_pct numeric, sort int)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT ili.description, ili.quantity, ili.unit_price, ili.discount_pct, ili.sort
  FROM public.invoice_line_items ili
  JOIN public.invoices i ON i.id = ili.invoice_id
  JOIN public.users u ON u.id = auth.uid()
  WHERE ili.invoice_id = p_invoice_id AND i.tenant_id = u.tenant_id
  ORDER BY ili.sort;
$$;

REVOKE ALL ON FUNCTION public.save_invoice_with_items(jsonb, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.save_invoice_with_items(jsonb, jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.get_invoice_doc(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_invoice_doc(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_invoice_items(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_invoice_items(uuid) TO authenticated;
