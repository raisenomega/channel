-- 069 — save_branding escribe en el MISMO tenant que la app LEE (mi_tenant = users.tenant_id de
-- auth.uid()), no en current_tenant()/app.tenant_id. En cuentas donde users.tenant_id != app.tenant_id
-- el RPC guardaba en un tenant y la app leia de otro -> toast verde pero "no persiste" + logo no
-- aparecia. Alinea escritura<->lectura. SECURITY DEFINER, solo el tenant propio. Merge jsonb.
CREATE OR REPLACE FUNCTION public.save_branding(patch jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE tid uuid;
BEGIN
  SELECT u.tenant_id INTO tid FROM public.users u WHERE u.id = auth.uid() LIMIT 1;
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
