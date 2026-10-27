-- 103 — SKU completo + afinidad con Nucleo. Amplia public.items con catalogo+inventario BASICO (NO avanzado:
-- multi-almacen/serie/GL/costo-promedio son de Nucleo). name cap 75, description cap 750. sku = llave de
-- sincronizacion con Nucleo (inventory_items.sku). RPCs via jsonb (evita 15 parametros). Aditivo e idempotente.
-- CERO DOWNTIME: las create_item/update_item viejas (texto) se CONSERVAN; se AGREGAN las nuevas (jsonb). El
-- frontend viejo sigue funcionando hasta desplegar el nuevo. list_items se recrea con mas columnas (compat).

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS stock numeric(12,2),
  ADD COLUMN IF NOT EXISTS track_inventory boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lot_number text,
  ADD COLUMN IF NOT EXISTS expiry_date date,
  ADD COLUMN IF NOT EXISTS unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate numeric(5,2) NOT NULL DEFAULT 11.5,
  ADD COLUMN IF NOT EXISTS unit_of_measure text,
  ADD COLUMN IF NOT EXISTS barcode text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- sku unico por tenant (casa con Nucleo); parcial para ignorar NULL/''
CREATE UNIQUE INDEX IF NOT EXISTS items_tenant_sku_uniq
  ON public.items (tenant_id, sku) WHERE sku IS NOT NULL AND sku <> '';

CREATE OR REPLACE FUNCTION public.create_item(p jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid; _id uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL OR nullif(trim(coalesce(p->>'name', '')), '') IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.items (tenant_id, name, description, unit_price, item_type, category_id, sku, stock,
    track_inventory, lot_number, expiry_date, unit_cost, tax_rate, unit_of_measure, barcode, image_url, is_active)
  VALUES (_tid, left(trim(p->>'name'), 75), nullif(left(trim(coalesce(p->>'description', '')), 750), ''),
    coalesce((p->>'unit_price')::numeric, 0),
    CASE WHEN p->>'item_type' IN ('servicio', 'producto') THEN p->>'item_type' ELSE 'servicio' END,
    nullif(p->>'category_id', '')::uuid, nullif(trim(coalesce(p->>'sku', '')), ''), nullif(p->>'stock', '')::numeric,
    coalesce((p->>'track_inventory')::boolean, false), nullif(trim(coalesce(p->>'lot_number', '')), ''),
    nullif(p->>'expiry_date', '')::date, coalesce((p->>'unit_cost')::numeric, 0),
    coalesce((p->>'tax_rate')::numeric, 11.5), nullif(trim(coalesce(p->>'unit_of_measure', '')), ''),
    nullif(trim(coalesce(p->>'barcode', '')), ''), nullif(trim(coalesce(p->>'image_url', '')), ''),
    coalesce((p->>'is_active')::boolean, true))
  RETURNING id INTO _id;
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.update_item(p_id uuid, p jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL THEN RETURN false; END IF;
  UPDATE public.items SET name = left(trim(coalesce(p->>'name', name)), 75),
    description = nullif(left(trim(coalesce(p->>'description', '')), 750), ''),
    unit_price = coalesce((p->>'unit_price')::numeric, 0),
    item_type = CASE WHEN p->>'item_type' IN ('servicio', 'producto') THEN p->>'item_type' ELSE item_type END,
    category_id = nullif(p->>'category_id', '')::uuid, sku = nullif(trim(coalesce(p->>'sku', '')), ''),
    stock = nullif(p->>'stock', '')::numeric, track_inventory = coalesce((p->>'track_inventory')::boolean, false),
    lot_number = nullif(trim(coalesce(p->>'lot_number', '')), ''), expiry_date = nullif(p->>'expiry_date', '')::date,
    unit_cost = coalesce((p->>'unit_cost')::numeric, 0), tax_rate = coalesce((p->>'tax_rate')::numeric, 11.5),
    unit_of_measure = nullif(trim(coalesce(p->>'unit_of_measure', '')), ''),
    barcode = nullif(trim(coalesce(p->>'barcode', '')), ''), image_url = nullif(trim(coalesce(p->>'image_url', '')), ''),
    is_active = coalesce((p->>'is_active')::boolean, true)
  WHERE id = p_id AND tenant_id = _tid;
  RETURN FOUND;
END; $$;

DROP FUNCTION IF EXISTS public.list_items();
CREATE OR REPLACE FUNCTION public.list_items()
RETURNS TABLE (id uuid, name text, description text, unit_price numeric, item_type text, category_id uuid,
  category_name text, sku text, stock numeric, track_inventory boolean, lot_number text, expiry_date date,
  unit_cost numeric, tax_rate numeric, unit_of_measure text, barcode text, image_url text, is_active boolean)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT i.id, i.name, i.description, i.unit_price, i.item_type, i.category_id, c.name, i.sku, i.stock,
    i.track_inventory, i.lot_number, i.expiry_date, i.unit_cost, i.tax_rate, i.unit_of_measure, i.barcode,
    i.image_url, i.is_active
  FROM public.items i JOIN public.users u ON u.id = auth.uid()
  LEFT JOIN public.item_categories c ON c.id = i.category_id
  WHERE i.tenant_id = u.tenant_id ORDER BY i.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.create_item(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_item(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_items() TO authenticated;
