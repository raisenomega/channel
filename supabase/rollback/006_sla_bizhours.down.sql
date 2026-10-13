-- ROLLBACK 006: Eliminar tablas SLA, business hours, canned responses
DROP TABLE IF EXISTS public.canned_responses CASCADE;
DROP TABLE IF EXISTS public.business_hours CASCADE;
DROP TABLE IF EXISTS public.sla_policies CASCADE;