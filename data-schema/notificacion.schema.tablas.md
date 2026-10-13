# Data Schema — Notificaciones

## Tabla `internal_notifications`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| user_id | uuid FK → users | Destinatario |
| type | enum | assignment / mention / sla_breach / ai_alert |
| title | text NOT NULL | Título |
| body | text | Cuerpo |
| is_read | boolean DEFAULT false | Leída |
| created_at | timestamptz | DEFAULT NOW() |

## RLS
`tenant_isolation_internal_notifications` + usuario solo ve las propias
(`user_id = auth.uid()`).
