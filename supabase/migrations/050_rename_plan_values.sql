-- 050_rename_plan_values.sql
-- R-7 (Compuerta #81): renombra los planes a los nombres oficiales. `plan` es columna TEXT + CHECK
-- (NO enum pg), asi que el approach correcto es backfill + swap del CHECK (no CREATE TYPE/ALTER TYPE).
-- Mapping firmado owner: lite_starter->esencial, lite_pro->pro, lite_business->business.
-- ecosystem / enterprise se preservan; inbox_addon ELIMINADO (Compuerta #84: 0 uso real).
-- Idempotente y no-destructivo. Owner aplica por SQL Editor pre-merge (ordering: 050 antes del code).

BEGIN;

-- 1) Backfill de valores existentes
UPDATE public.tenants SET plan = CASE plan
  WHEN 'lite_starter'  THEN 'esencial'
  WHEN 'lite_pro'      THEN 'pro'
  WHEN 'lite_business' THEN 'business'
  ELSE plan
END
WHERE plan IN ('lite_starter', 'lite_pro', 'lite_business');

-- 2) Swap del CHECK: 5 valores oficiales (SIN inbox_addon)
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_plan_check;
ALTER TABLE public.tenants ADD CONSTRAINT tenants_plan_check
  CHECK (plan IN ('esencial', 'pro', 'business', 'ecosystem', 'enterprise'));

-- 3) Default del plan base oficial
ALTER TABLE public.tenants ALTER COLUMN plan SET DEFAULT 'esencial';

-- 4) RPC 021: default p_plan -> 'esencial' (re-crea con el mismo cuerpo, solo cambia el default)
CREATE OR REPLACE FUNCTION public.crear_tenant_onboarding(
  p_name text,
  p_slug text,
  p_plan text DEFAULT 'esencial',
  p_language text DEFAULT 'es'
) RETURNS uuid
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tenant_id uuid;
  v_email text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'no_autenticado';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'nombre_vacio';
  END IF;
  IF p_slug IS NULL OR length(trim(p_slug)) = 0 THEN
    RAISE EXCEPTION 'slug_vacio';
  END IF;

  BEGIN
    IF EXISTS (SELECT 1 FROM public.users WHERE id = v_uid AND tenant_id IS NOT NULL) THEN
      SELECT tenant_id INTO v_tenant_id FROM public.users WHERE id = v_uid;
      RETURN v_tenant_id;
    END IF;

    v_email := (SELECT email FROM auth.users WHERE id = v_uid);
    IF v_email IS NULL THEN
      v_email := 'usuario' || replace(v_uid::text, '-', '') || '@hub.local';
    END IF;

    INSERT INTO public.tenants (name, slug, plan, status, default_language)
    VALUES (trim(p_name), lower(trim(p_slug)), p_plan, 'trial', p_language)
    RETURNING id INTO v_tenant_id;

    INSERT INTO public.users (id, tenant_id, email, role, language, is_active, is_online)
    VALUES (v_uid, v_tenant_id, v_email, 'owner', p_language, true, true)
    ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      role = EXCLUDED.role,
      is_active = true;

    INSERT INTO public.agents (tenant_id, user_id, agent_type, display_name, role, is_active)
    VALUES (v_tenant_id, v_uid, 'human', coalesce(p_name, 'Owner'), 'owner', true);

    INSERT INTO public.teams (tenant_id, name, is_active)
    VALUES (v_tenant_id, 'Ventas', true);

    RETURN v_tenant_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'onboarding: %', SQLERRM;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crear_tenant_onboarding(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crear_tenant_onboarding(text, text, text, text) TO service_role;

COMMIT;
