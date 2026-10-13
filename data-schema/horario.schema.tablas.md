# Data Schema — Horario y SLA

## Tabla `business_hours`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| inbox_id | uuid FK → inboxes | Canal (opcional, null = global) |
| timezone | text NOT NULL | Zona horaria IANA |
| schedule | jsonb | Horas por día de la semana |
| created_at | timestamptz | DEFAULT NOW() |

## Tabla `sla_policies`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| name | text NOT NULL | Nombre de la política |
| first_response_seconds | int | SLA primera respuesta |
| resolution_seconds | int | SLA resolución |
| priority | enum | low / medium / high / urgent |
| created_at | timestamptz | DEFAULT NOW() |

## RLS
Ambas con `tenant_isolation_*`.
