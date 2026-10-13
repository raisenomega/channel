-- ROLLBACK 016: Eliminar tablas audit + rate limit
DROP TABLE IF EXISTS public.rate_limit_config CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;