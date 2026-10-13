-- ROLLBACK 001: Eliminar extensiones y funciones helpers
DROP FUNCTION IF EXISTS public.current_tenant() CASCADE;
DROP FUNCTION IF EXISTS public.is_hub_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_hub_owner() CASCADE;
DROP FUNCTION IF EXISTS public.is_superadmin() CASCADE;
DROP FUNCTION IF EXISTS public._set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.sanitize_phone(text) CASCADE;
DROP FUNCTION IF EXISTS public.sanitize_email(text) CASCADE;