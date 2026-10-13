# Data Schema — Convenciones Globales

## Nombres
- Tablas en plural snake_case (`conversations`, `message_attachments`).
- PK siempre `id uuid`. Timestamps `created_at`/`updated_at` con `DEFAULT NOW()`.

## Multi-tenancy (regla N1)
- Toda tabla de tenant lleva `tenant_id uuid NOT NULL REFERENCES tenants(id)`.
- Excepción: `tenants`, `webhook_provider_configs`, `agent_global_knowledge`, `agent_vertical_templates`.
- RLS activo por defecto; policy `tenant_isolation_<tabla>` valida `tenant_id = current_tenant()`.

## Helpers globales
- `current_tenant()` — tenant del usuario autenticado (JWT).
- `can_access_module(mod)` — permiso granular.
- `is_hub_admin()` / `is_hub_owner()` / `is_superadmin()`.
- `_set_updated_at()` — trigger de mantenimiento.
- `_audit_trigger()` — audit log automático en tablas sensibles.
- `sanitize_phone()` / `sanitize_email()` — normalización.

## Extensiones habilitadas
`pgvector`, `pg_trgm`, `unaccent`, `pg_cron`, `pg_partman`, `http`, `pgcrypto`.

## Particionado mensual (pg_partman)
`messages`, `automation_rule_executions`, `audit_logs`, `webhook_events`,
`integration_sync_logs`, `agent_interactions`.
