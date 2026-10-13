-- ROLLBACK 010: Eliminar tabla automation
DROP TABLE IF EXISTS public.automation_rule_executions CASCADE;
DROP TABLE IF EXISTS public.automation_rules CASCADE;