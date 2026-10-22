-- 068 — RPC para guardar branding_config del tenant del USUARIO sin exigir is_hub_owner().
-- La RLS de tenants (tenants_update_own) exige is_hub_owner() (users.id = auth.uid() con role owner),
-- que falla si el id de public.users no coincide con auth.uid() -> el owner real no puede guardar su
-- plantilla/logo. Este RPC corre SECURITY DEFINER (bypass RLS) pero SOLO toca el tenant del llamante
-- (current_tenant(), que ya resuelve para lectura/citas) -> no puede tocar otros tenants. Merge jsonb.
CREATE OR REPLACE FUNCTION public.save_branding(patch jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE tid uuid := current_tenant();
BEGIN
  IF tid IS NULL THEN
    RETURN false;
  END IF;
  UPDATE public.tenants
     SET branding_config = coalesce(branding_config, '{}'::jsonb) || patch,
         updated_at = now()
   WHERE id = tid;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.save_branding(jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.save_branding(jsonb) TO authenticated;
