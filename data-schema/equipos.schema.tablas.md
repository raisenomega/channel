# Data Schema — Agentes y Equipos

## Tabla `agents`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| user_id | uuid FK → users | Usuario humano asociado (opcional) |
| name | text NOT NULL | Nombre visible |
| role | text | Rol en el equipo |
| is_ai | boolean DEFAULT false | Es agente IA |
| brand_voice_id | uuid | Voice heredado de OMEGA |
| created_at | timestamptz | DEFAULT NOW() |

## Tabla `teams`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| name | text NOT NULL | Nombre del equipo |
| created_at | timestamptz | DEFAULT NOW() |

## Tabla `agent_teams` (N:M)
| Columna | Tipo | Descripción |
|---|---|---|
| agent_id | uuid FK → agents | Agente |
| team_id | uuid FK → teams | Equipo |
| — | PRIMARY KEY (agent_id, team_id) | Clave compuesta |

## RLS
Las tres con `tenant_isolation_*` (`tenant_id = current_tenant()`).
`agent_teams` hereda por join a `agents.tenant_id`.
