-- 072 — LECTURA determinista de las lineas de una cotizacion (espejo de get_branding): resuelve el
-- tenant via users.tenant_id de auth.uid(), NO por current_tenant(). La RLS de quote_line_items filtra
-- por current_tenant() y en cuentas donde este no coincide con users.tenant_id la lectura directa
-- devolvia vacio -> el PDF no mostraba descripcion/cantidad/precio. Con este RPC SECURITY DEFINER las
-- lineas se leen del MISMO tenant donde save_quote_with_items las escribio. Solo del tenant propio.
CREATE OR REPLACE FUNCTION public.get_quote_items(p_quote_id uuid)
RETURNS TABLE (
  description text,
  quantity numeric,
  unit_price numeric,
  discount_pct numeric,
  sort int
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT qli.description, qli.quantity, qli.unit_price, qli.discount_pct, qli.sort
  FROM public.quote_line_items qli
  JOIN public.quotes q ON q.id = qli.quote_id
  JOIN public.users u ON u.id = auth.uid()
  WHERE qli.quote_id = p_quote_id AND q.tenant_id = u.tenant_id
  ORDER BY qli.sort;
$$;

REVOKE ALL ON FUNCTION public.get_quote_items(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_quote_items(uuid) TO authenticated;
