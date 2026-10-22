-- 078 — Orden con lineas + datos de cliente para el PDF "ORDEN". Al convertir, copia items jsonb +
-- cliente de la factura a la orden. get_order_doc/get_order_items la leen (jsonb) para el PDF. Todo
-- por users.tenant_id. SECURITY DEFINER.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_address text;

CREATE OR REPLACE FUNCTION public.create_order_from_invoice(p_invoice_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _tid uuid; _inv public.invoices%ROWTYPE; _ord uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO _inv FROM public.invoices WHERE id = p_invoice_id AND tenant_id = _tid;
  IF _inv.id IS NULL OR _inv.contact_id IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.orders (tenant_id, contact_id, status, total_amount, notes, items, client_name, client_phone, client_email, client_address)
  VALUES (_tid, _inv.contact_id, 'pending', coalesce(_inv.total, 0), _inv.notes, coalesce(_inv.items, '[]'::jsonb),
          coalesce(_inv.client_name, ''), _inv.phone, _inv.email, _inv.client_address)
  RETURNING id INTO _ord;
  UPDATE public.invoices SET linked_order_id = _ord WHERE id = p_invoice_id;
  RETURN _ord;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_order_doc(p_order_id uuid)
RETURNS TABLE (client_name text, client_phone text, client_email text, client_address text, service text)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT o.client_name, o.client_phone, o.client_email, o.client_address, o.notes
  FROM public.orders o JOIN public.users u ON u.id = auth.uid()
  WHERE o.id = p_order_id AND o.tenant_id = u.tenant_id;
$$;

CREATE OR REPLACE FUNCTION public.get_order_items(p_order_id uuid)
RETURNS TABLE (description text, quantity numeric, unit_price numeric, discount_pct numeric, sort int)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT e->>'description', (e->>'quantity')::numeric, (e->>'unit_price')::numeric,
         coalesce((e->>'discount_pct')::numeric, 0), (ord::int - 1)
  FROM public.orders o JOIN public.users u ON u.id = auth.uid()
    CROSS JOIN LATERAL jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) WITH ORDINALITY AS t(e, ord)
  WHERE o.id = p_order_id AND o.tenant_id = u.tenant_id;
$$;

-- Al marcar la orden "paid" se crea un pago (una vez) enlazado -> aterriza en /payments y cierra el ciclo.
CREATE OR REPLACE FUNCTION public.set_order_status(p_order_id uuid, p_status text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _tid uuid; _ord public.orders%ROWTYPE;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL OR p_status NOT IN ('pending', 'paid', 'cancelled') THEN RETURN false; END IF;
  SELECT * INTO _ord FROM public.orders WHERE id = p_order_id AND tenant_id = _tid;
  IF _ord.id IS NULL THEN RETURN false; END IF;
  UPDATE public.orders SET status = p_status, paid_at = CASE WHEN p_status = 'paid' THEN now() ELSE paid_at END
   WHERE id = p_order_id;
  IF p_status = 'paid' AND _ord.total_amount > 0 AND NOT EXISTS (SELECT 1 FROM public.payments WHERE order_id = p_order_id) THEN
    INSERT INTO public.payments (tenant_id, order_id, amount, currency, status, provider)
    VALUES (_tid, p_order_id, _ord.total_amount, _ord.currency, 'completed', 'manual');
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.get_order_doc(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_order_doc(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_order_items(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_order_items(uuid) TO authenticated;
