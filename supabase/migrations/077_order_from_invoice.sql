-- 077 — Convertir factura -> orden + estado de la orden. orders no tenia paid_at (listarOrdenes lo
-- pedia en el select -> 400 -> lista vacia): se agrega. create_order_from_invoice crea la orden
-- (contacto + total de la factura, status pending) y enlaza invoices.linked_order_id. set_order_status
-- cambia a pending/paid/cancelled (sella paid_at al pagar). Todo por users.tenant_id. SECURITY DEFINER.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE OR REPLACE FUNCTION public.create_order_from_invoice(p_invoice_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _tid uuid; _inv public.invoices%ROWTYPE; _ord uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO _inv FROM public.invoices WHERE id = p_invoice_id AND tenant_id = _tid;
  IF _inv.id IS NULL OR _inv.contact_id IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.orders (tenant_id, contact_id, status, total_amount, notes)
  VALUES (_tid, _inv.contact_id, 'pending', coalesce(_inv.total, 0), _inv.notes)
  RETURNING id INTO _ord;
  UPDATE public.invoices SET linked_order_id = _ord WHERE id = p_invoice_id;
  RETURN _ord;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_order_status(p_order_id uuid, p_status text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _tid uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL OR p_status NOT IN ('pending', 'paid', 'cancelled') THEN RETURN false; END IF;
  UPDATE public.orders
     SET status = p_status, paid_at = CASE WHEN p_status = 'paid' THEN now() ELSE paid_at END
   WHERE id = p_order_id AND tenant_id = _tid;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_from_invoice(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.create_order_from_invoice(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.set_order_status(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_order_status(uuid, text) TO authenticated;
