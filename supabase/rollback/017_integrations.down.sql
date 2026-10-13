-- ROLLBACK 017: Eliminar tabla integrations
DROP TABLE IF EXISTS public.integration_sync_logs CASCADE;
DROP TABLE IF EXISTS public.integration_configs CASCADE;