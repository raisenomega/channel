-- ROLLBACK 004: Eliminar tablas channels (inboxes, webhook config)
DROP TABLE IF EXISTS public.webhook_provider_configs CASCADE;
DROP TABLE IF EXISTS public.inboxes CASCADE;