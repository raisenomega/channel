# Data Schema — Conversaciones (completo de 01_HUB_Data_Schema.md)

## Tabla `conversations`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | — |
| tenant_id | uuid FK → tenants | — |
| contact_id | uuid FK → contacts | — |
| primary_channel | enum | whatsapp/email/instagram/facebook/telegram/sms/x/linkedin/webchat |
| primary_inbox_id | uuid FK → inboxes | — |
| status | enum | open / pending / snoozed / resolved / archived |
| snoozed_until | timestamptz | Para reabrir automático |
| assigned_agent_id | uuid FK → agents | — |
| assigned_team_id | uuid FK → teams | — |
| operation_mode | enum | human / assistant / copilot / autonomous / escalated |
| subject | text | Para email |
| priority | enum | low / medium / high / critical |
| is_starred | boolean | Favorita (inbox) |
| total/inbound/outbound/ai/human_messages | int | Contadores |
| sla_policy_id / sla_*_deadline / sla_violated | — | SLA tracking |
| csat_score / csat_comment | — | Satisfacción |
| sentiment_score / sentiment_trend | numeric/enum | AI sentiment |
| contact_asked_if_bot / contact_asked_for_human | boolean | Indistinguibilidad |
| avg_indistinguishability_score | numeric | — |
| nucleo_case_id | uuid | Ecosystem |
| related_quote_ids / related_order_ids | uuid[] | — |
| first_message_at → archived_at | timestamptz | Timestamps del ciclo |
| created_at / updated_at | timestamptz | — |

## Tabla `conversation_tags`
PK compuesto (conversation_id, tag_id). Incluye `applied_by_user_id`, `applied_by_type`.

## Tabla `conversation_participants`
Soporta conversaciones tripartitas (ej: HEALTH: usuario↔nutricionista↔entrenador).
`participant_role`: primary_contact / observer / collaborator / assigned_agent / supervisor.

## RLS
Tenant isolation estándar en todas.