-- 071 — save_quote_with_items: upsert cotizacion + reemplazo atomico de sus lineas (espejo de
-- save_lead_with_items de Nucleo). SECURITY DEFINER; tenant = current_tenant() (igual que crearQuote
-- y la RLS de lectura -> consistente, sin la trampa users.tenant_id). Las lineas heredan el tenant
-- de la cotizacion. line_total y totales vienen calculados del cliente (tax a nivel documento desde
-- la plantilla). Tambien guarda el snapshot jsonb en quotes.items (paridad Nucleo).
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
    INSERT INTO public.quotes (tenant_id, contact_id, status, currency, items, subtotal, tax_total, total, total_amount)
    VALUES (_tid, nullif(p_quote->>'contact_id', '')::uuid, coalesce(p_quote->>'status', 'draft'),
            coalesce(p_quote->>'currency', 'USD'), p_items, (p_quote->>'subtotal')::numeric,
            (p_quote->>'tax_total')::numeric, (p_quote->>'total')::numeric, (p_quote->>'total')::numeric)
    RETURNING id INTO _id;
  ELSE
    UPDATE public.quotes SET contact_id = nullif(p_quote->>'contact_id', '')::uuid,
      currency = coalesce(p_quote->>'currency', 'USD'), items = p_items,
      subtotal = (p_quote->>'subtotal')::numeric, tax_total = (p_quote->>'tax_total')::numeric,
      total = (p_quote->>'total')::numeric, total_amount = (p_quote->>'total')::numeric
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

REVOKE ALL ON FUNCTION public.save_quote_with_items(jsonb, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.save_quote_with_items(jsonb, jsonb) TO authenticated;
