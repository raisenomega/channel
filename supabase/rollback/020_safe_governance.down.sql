-- ROLLBACK 020: Eliminar tablas SAFE governance
DROP TABLE IF EXISTS public.safe_weekly_reports CASCADE;
DROP TABLE IF EXISTS public.autonomy_progression CASCADE;
DROP TABLE IF EXISTS public.safe_evaluations CASCADE;