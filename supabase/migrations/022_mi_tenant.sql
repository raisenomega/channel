-- ============================================================================
-- HUB by Raisen — Migración 022: resolución segura del tenant del usuario
-- RPC SECURITY DEFINER que devuelve el tenant del usuario autenticado sin
-- depender del RLS de `users` (evita recursion de current_tenant() en la
-- consulta que hace el frontend al resolver el tenant post-login).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mi_tenant()
RETURNS TABLE (
  tenant_id uuid,
  name      text,
  slug      text,
  plan      text,
  email     text,
  role      text
)
  LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT
    t.id,
    t.name,
    t.slug,
    t.plan,
    u.email,
    u.role
  FROM public.users u
  JOIN public.tenants t ON t.id = u.tenant_id
  WHERE u.id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.mi_tenant() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mi_tenant() TO service_role;