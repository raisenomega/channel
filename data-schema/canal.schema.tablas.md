# Data Schema — Canales (completo de 01_HUB_Data_Schema.md)

## Tabla `inboxes`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | — |
| tenant_id | uuid FK → tenants | — |
| channel_type | enum | whatsapp/email/instagram/facebook/telegram/sms/x/linkedin/webchat |
| name | text | Nombre visible |
| provider | text | zernio / resend / meta_direct / twilio |
| provider_config | jsonb | Config del proveedor (sin secretos) |
| secrets_encrypted | jsonb | Cifrado con pgcrypto |
| webhook_secret | text | Para verificación |
| is_active | boolean | — |
| is_primary_for_channel | boolean | Default para el canal |
| sync_status | enum | connected / disconnected / error / pending |
| last_sync_at | timestamptz | — |
| created_at | timestamptz | — |

## Tabla `webhook_provider_configs` (global)
Provider endpoints + versiones. Sin tenant_id (global, readonly para tenants).

## RLS
- `inboxes`: tenant isolation estándar.
- `webhook_provider_configs`: solo lectura para tenants.