-- 105 — Particiones DEFAULT para las tablas particionadas por rango que NUNCA tuvieron particion. Hoy sus
-- INSERT FALLAN en silencio ('no partition of relation found for row'): el trail de auditoria (audit_logs,
-- retencion 3 anos) y el log de consentimiento (consent_log) estan ROTOS para escribir -> sin forense ni
-- cumplimiento bank-grade. Igual que la migracion 053 hizo con messages, creamos una particion DEFAULT
-- catch-all por tabla para que escriban YA. Hereda la RLS del padre (las policies aplican a las particiones).
-- El particionado mensual real por rango (pg_partman) + retencion queda para despues; esto detiene el sangrado
-- sin perder datos. IF NOT EXISTS -> idempotente (si una ya tuviera DEFAULT por un parche manual, no rompe).
CREATE TABLE IF NOT EXISTS public.audit_logs_default PARTITION OF public.audit_logs DEFAULT;
CREATE TABLE IF NOT EXISTS public.consent_log_default PARTITION OF public.consent_log DEFAULT;
CREATE TABLE IF NOT EXISTS public.integration_sync_logs_default PARTITION OF public.integration_sync_logs DEFAULT;
CREATE TABLE IF NOT EXISTS public.automation_rule_executions_default PARTITION OF public.automation_rule_executions DEFAULT;
