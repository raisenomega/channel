-- 082 — Catalogo de items (SKU) por negocio: servicios/productos reutilizables en las lineas de
-- cotizacion/factura. Lectura Y escritura via RPC SECURITY DEFINER que resuelven users.tenant_id
-- (este owner: users.tenant_id != app.tenant_id). RLS tambien por current_tenant() como respaldo.
CREATE TABLE IF NOT EXISTS public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  item_type text NOT NULL DEFAULT 'servicio' CHECK (item_type IN ('servicio', 'producto')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS items_rw ON public.items;
CREATE POLICY items_rw ON public.items FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());

CREATE OR REPLACE FUNCTION public.list_items()
RETURNS TABLE (id uuid, name text, description text, unit_price numeric, item_type text)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT i.id, i.name, i.description, i.unit_price, i.item_type
  FROM public.items i JOIN public.users u ON u.id = auth.uid()
  WHERE i.tenant_id = u.tenant_id ORDER BY i.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.create_item(p_name text, p_description text, p_unit_price numeric, p_type text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid; _id uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL OR p_name IS NULL OR trim(p_name) = '' THEN RETURN NULL; END IF;
  INSERT INTO public.items (tenant_id, name, description, unit_price, item_type)
  VALUES (_tid, trim(p_name), nullif(trim(coalesce(p_description, '')), ''), coalesce(p_unit_price, 0),
          CASE WHEN p_type IN ('servicio', 'producto') THEN p_type ELSE 'servicio' END)
  RETURNING id INTO _id;
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_item(p_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL THEN RETURN false; END IF;
  DELETE FROM public.items WHERE id = p_id AND tenant_id = _tid;
  RETURN true;
END; $$;

GRANT EXECUTE ON FUNCTION public.list_items() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_item(text, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_item(uuid) TO authenticated;
