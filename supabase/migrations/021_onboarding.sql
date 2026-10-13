-- ============================================================================
-- HUB by Raisen — Migración 021: BC identity + onboarding de tenant
-- Funcion SECURITY DEFINER para que un usuario autenticado cree su tenant
-- y quede como owner. El RLS no permite al usuario insertar tenants/users
-- directo (evita "tenant squatting"); este es el camino controlado.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.crear_tenant_onboarding(
  p_name text,
  p_slug text,
  p_plan text DEFAULT 'lite_starter',
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
    -- Ya tiene tenant: no crear duplicado
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

    -- Agente por defecto ligado al owner humano
    INSERT INTO public.agents (tenant_id, user_id, agent_type, display_name, role, is_active)
    VALUES (v_tenant_id, v_uid, 'human', coalesce(p_name, 'Owner'), 'owner', true);

    -- Equipo por defecto del tenant
    INSERT INTO public.teams (tenant_id, name, is_active)
    VALUES (v_tenant_id, 'Ventas', true);

    RETURN v_tenant_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'onboarding: %', SQLERRM;
  END;
END;
$$;

-- Permiso de ejecucion: cualquier rol autenticado puede llamar
GRANT EXECUTE ON FUNCTION public.crear_tenant_onboarding(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.crear_tenant_onboarding(text, text, text, text) TO service_role;