-- ROLLBACK 022: Eliminar el RPC mi_tenant
DROP FUNCTION IF EXISTS public.mi_tenant() CASCADE;