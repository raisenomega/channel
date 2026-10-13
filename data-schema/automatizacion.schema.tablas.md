# Data Schema — Automatización

> `automation_rule_executions` está particionada mensualmente.

## Tabla `automation_rules`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| name | text NOT NULL | Nombre |
| trigger | enum | message_received / tag_added / sla_breach / scheduled |
| conditions | jsonb | Condiciones |
| actions | jsonb | Acciones a ejecutar |
| is_active | boolean DEFAULT true | Habilitado |
| created_at | timestamptz | DEFAULT NOW() |

## Tabla `automation_rule_executions`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| rule_id | uuid FK → automation_rules | Regla |
| conversation_id | uuid FK → conversations | Contexto |
| result | enum | success / failed / skipped |
| executed_at | timestamptz | DEFAULT NOW() |

## Tabla `canned_responses`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| shortcode | text NOT NULL | Atajo (ej. `/saludo`) |
| content | text NOT NULL | Contenido enlatado |

## RLS
Todas con `tenant_isolation_*`.
