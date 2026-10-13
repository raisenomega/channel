# Data Schema — Mensajes (completo de 01_HUB_Data_Schema.md)

> Particionada mensualmente (pg_partman). Tabla de alto volumen.

## Tabla `messages`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | — |
| tenant_id | uuid FK → tenants | — |
| conversation_id | uuid FK → conversations | — |
| contact_id | uuid FK → contacts | — |
| inbox_id | uuid FK → inboxes | — |
| direction | enum | inbound / outbound / internal |
| sender_type | enum | contact / human_agent / ai_agent / system |
| sender_user_id | uuid FK → users | Si human_agent |
| channel | text | whatsapp/email/instagram... |
| provider | text | zernio / resend / meta_direct |
| provider_message_id / provider_thread_id | text | IDs del proveedor |
| content_type | enum | text / template / image / video / audio / document / location / ... |
| content / content_html | text | Contenido |
| template_name / template_language / template_params | — | WhatsApp template |
| has_attachments / attachments_count | boolean / int | — |
| reply_to_message_id / forwarded_from_message_id | uuid FK → messages | — |
| status | enum | draft / sending / sent / delivered / read / failed / received |
| error_code / error_message / retry_count | — | Manejo de fallos |
| ai_agent_interaction_id | uuid | Trazabilidad IA |
| ai_confidence / ai_mode | numeric(0-1) / enum | assistant/copilot/autonomous |
| ai_was_edited_by_human | boolean | Editado por humano |
| intentional_delay_ms / simulated_typing_duration_ms | int | Indistinguibilidad |
| created_at | timestamptz | — |

## Tabla `message_attachments`
file_url, mime_type, size_bytes, content_type (image/audio/video/document/...).

## Tabla `message_reactions`
message_id + user_id + emoji. PK compuesta.

## RLS
Tenant isolation estándar.