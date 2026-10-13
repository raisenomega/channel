# Data Schema — Plantillas WhatsApp

## Tabla `whatsapp_templates`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| inbox_id | uuid FK → inboxes | Canal WhatsApp |
| name | text NOT NULL | Nombre |
| language | varchar(5) | Código de idioma (es_MX, en_US) |
| category | enum | marketing / utility / authentication |
| status | enum | draft / approved / rejected |
| components | jsonb | Header / body / footer / buttons |
| provider_template_id | text | ID en Meta |
| created_at | timestamptz | DEFAULT NOW() |

## RLS
`tenant_isolation_whatsapp_templates` (`tenant_id = current_tenant()`).
