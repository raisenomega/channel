-- 083 — SKU en tarjetas: categorias por negocio (CRUD) + items.category_id + update_item. RPCs
-- SECURITY DEFINER por users.tenant_id (robusto ante current_tenant() que no resuelve para este owner).
CREATE TABLE IF NOT EXISTS public.item_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS item_categories_rw ON public.item_categories;
CREATE POLICY item_categories_rw ON public.item_categories FOR ALL USING (tenant_id = current_tenant()) WITH CHECK (tenant_id = current_tenant());
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.item_categories(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.list_item_categories()
RETURNS TABLE (id uuid, name text) LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT c.id, c.name FROM public.item_categories c JOIN public.users u ON u.id = auth.uid()
  WHERE c.tenant_id = u.tenant_id ORDER BY c.created_at ASC;
$$;

CREATE OR REPLACE FUNCTION public.create_item_category(p_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid; _id uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL OR p_name IS NULL OR trim(p_name) = '' THEN RETURN NULL; END IF;
  INSERT INTO public.item_categories (tenant_id, name) VALUES (_tid, trim(p_name)) RETURNING id INTO _id;
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_item_category(p_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL THEN RETURN false; END IF;
  DELETE FROM public.item_categories WHERE id = p_id AND tenant_id = _tid;
  RETURN true;
END; $$;

DROP FUNCTION IF EXISTS public.create_item(text, text, numeric, text);
CREATE OR REPLACE FUNCTION public.create_item(p_name text, p_description text, p_unit_price numeric, p_category_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid; _id uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL OR p_name IS NULL OR trim(p_name) = '' THEN RETURN NULL; END IF;
  INSERT INTO public.items (tenant_id, name, description, unit_price, category_id)
  VALUES (_tid, left(trim(p_name), 12), nullif(left(trim(coalesce(p_description, '')), 250), ''), coalesce(p_unit_price, 0), p_category_id)
  RETURNING id INTO _id;
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.update_item(p_id uuid, p_name text, p_description text, p_unit_price numeric, p_category_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tid uuid;
BEGIN
  SELECT u.tenant_id INTO _tid FROM public.users u WHERE u.id = auth.uid();
  IF _tid IS NULL THEN RETURN false; END IF;
  UPDATE public.items SET name = left(trim(p_name), 12), description = nullif(left(trim(coalesce(p_description, '')), 250), ''),
    unit_price = coalesce(p_unit_price, 0), category_id = p_category_id WHERE id = p_id AND tenant_id = _tid;
  RETURN true;
END; $$;

DROP FUNCTION IF EXISTS public.list_items();
CREATE OR REPLACE FUNCTION public.list_items()
RETURNS TABLE (id uuid, name text, description text, unit_price numeric, item_type text, category_id uuid, category_name text)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT i.id, i.name, i.description, i.unit_price, i.item_type, i.category_id, c.name
  FROM public.items i JOIN public.users u ON u.id = auth.uid()
  LEFT JOIN public.item_categories c ON c.id = i.category_id
  WHERE i.tenant_id = u.tenant_id ORDER BY i.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_item_categories() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_item_category(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_item_category(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_item(text, text, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_item(uuid, text, text, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_items() TO authenticated;
