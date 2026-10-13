# Data Schema — Auditoría

> `audit_logs`, `webhook_events` y `webhook_failures` particionadas mensualmente.

## Tabla `audit_logs` (append-only)
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| actor_id | uuid | Usuario o agente |
| action | text NOT NULL | Acción realizada |
| resource | text NOT NULL | Recurso accedido |
| details | jsonb | Detalles adicionales |
| ip_address | inet | Dirección IP |
| created_at | timestamptz | DEFAULT NOW() |

## Tabla `webhook_events`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| inbox_id | uuid FK → inboxes | Canal |
| provider | text NOT NULL | Proveedor |
| event_type | text NOT NULL | Tipo de evento |
| payload | jsonb | Payload recibido |
| verified | boolean | Firma verificada |
| created_at | timestamptz | DEFAULT NOW() |

## Tabla `webhook_failures` (dead-letter)
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| event_id | uuid | Evento origen |
| reason | text NOT NULL | Motivo del fallo |
| attempts | int | Reintentos |
| created_at | timestamptz | DEFAULT NOW() |

## Regla
`audit_logs` no admite UPDATE ni DELETE (trigger de protección).
