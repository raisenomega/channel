-- 084 — Numeracion secuencial de cotizacion. El negocio define prefijo+correlativo+pad en Configuracion;
-- cada NUEVA cotizacion toma el siguiente numero (atomico) y sale en el PDF. tenant via current_tenant()
-- (consistente con save_quote_with_items). get_quote_doc devuelve quote_number para el PDF.
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS quote_seq_prefix text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS quote_seq_next int;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS quote_seq_pad int;

CREATE OR REPLACE FUNCTION public.set_quote_numbering(p_prefix text, p_next int, p_pad int)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid := current_tenant();
BEGIN
  IF _tid IS NULL THEN RETURN false; END IF;
  UPDATE public.tenants SET quote_seq_prefix = p_prefix,
    quote_seq_next = greatest(coalesce(p_next, 1), 1), quote_seq_pad = greatest(coalesce(p_pad, 4), 1)
  WHERE id = _tid;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.get_quote_numbering()
RETURNS TABLE (prefix text, next int, pad int) LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT quote_seq_prefix, quote_seq_next, quote_seq_pad FROM public.tenants WHERE id = current_tenant();
$$;

CREATE OR REPLACE FUNCTION public.save_quote_with_items(p_quote jsonb, p_items jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid := current_tenant(); _id uuid; _pfx text; _num int; _pad int;
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
    UPDATE public.tenants SET quote_seq_next = quote_seq_next + 1
      WHERE id = _tid AND quote_seq_next IS NOT NULL
      RETURNING quote_seq_prefix, quote_seq_next - 1, coalesce(quote_seq_pad, 4) INTO _pfx, _num, _pad;
    IF _num IS NOT NULL THEN
      UPDATE public.quotes SET quote_number = coalesce(_pfx, '') || lpad(_num::text, _pad, '0') WHERE id = _id;
    END IF;
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
END; $$;

DROP FUNCTION IF EXISTS public.get_quote_doc(uuid);
CREATE OR REPLACE FUNCTION public.get_quote_doc(p_quote_id uuid)
RETURNS TABLE (client_name text, client_phone text, client_email text, client_address text, service text, quote_number text)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT q.client_name, q.client_phone, q.client_email, q.client_address, q.notes, q.quote_number
  FROM public.quotes q JOIN public.users u ON u.id = auth.uid()
  WHERE q.id = p_quote_id AND q.tenant_id = u.tenant_id;
$$;

GRANT EXECUTE ON FUNCTION public.set_quote_numbering(text, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_quote_numbering() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_quote_doc(uuid) TO authenticated;
