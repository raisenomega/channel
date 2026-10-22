-- 070 — LECTURA simetrica a la escritura (espejo de Nucleo): get_branding() resuelve el tenant igual
-- que save_branding/mi_tenant (users.tenant_id de auth.uid()), NO por current_tenant(). La RLS de
-- SELECT de tenants (tenants_read_own: id = current_tenant()) devolvia vacio cuando users.tenant_id
-- != app.tenant_id -> la app leia nada y el form se borraba pese a guardar verde. Con este RPC
-- SECURITY DEFINER la lectura ve EXACTAMENTE el tenant donde save_branding escribe.
CREATE OR REPLACE FUNCTION public.get_branding()
RETURNS TABLE (
  name text,
  phone text,
  street text,
  city text,
  region text,
  postal_code text,
  branding_config jsonb
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT t.name, t.phone, t.street, t.city, t.region, t.postal_code, t.branding_config
  FROM public.users u
  JOIN public.tenants t ON t.id = u.tenant_id
  WHERE u.id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_branding() FROM public;
GRANT EXECUTE ON FUNCTION public.get_branding() TO authenticated;
