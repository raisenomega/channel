# Data Schema — Integraciones

> `integration_sync_logs` particionada mensualmente.

## Tabla `integration_configs`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| type | enum | nucleo / omega / pos / table / health / home / fleet / safe |
| config | jsonb | Config |
| secrets_encrypted | jsonb | Secretos cifrados |
| is_active | boolean DEFAULT true | Habilitado |
| created_at | timestamptz | DEFAULT NOW() |

## Tabla `integration_sync_logs`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| integration_id | uuid FK → integration_configs | Integración |
| direction | enum | inbound / outbound |
| entity | text | Tipo de entidad sincronizada |
| status | enum | success / failed / partial |
| details | jsonb | Detalles |
| created_at | timestamptz | DEFAULT NOW() |

## RLS
Ambas con `tenant_isolation_*`.
