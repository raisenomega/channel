-- ROLLBACK 021: Eliminar la funcion de onboarding
DROP FUNCTION IF EXISTS public.crear_tenant_onboarding(text, text, text, text) CASCADE;