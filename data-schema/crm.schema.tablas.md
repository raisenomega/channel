# Data Schema — BC contacts (completo de 01_HUB_Data_Schema.md)

## Tabla `contacts` (CRM Lite)
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | — |
| tenant_id | uuid FK → tenants | — |
| first_name / last_name / display_name | text | — |
| primary_phone / primary_email | text | Normalizados |
| language | text | ISO 639-1 |
| timezone / country_code / city / region | text | Datos demográficos |
| segment | enum | new_lead / prospect / customer / recurring / vip / at_risk / churned / blocked |
| ltv_usd / first_purchase_date / last_purchase_date | numeric/date | Valor |
| total_orders / avg_order_value_usd | int/numeric | — |
| preferred_channel / preferred_contact_time | text/jsonb | Aprendido por IA |
| nucleo_customer_id / pos_customer_id | uuid | Ecosystem |
| external_ids | jsonb | IDs externos |
| custom_attributes | jsonb | Campos del tenant |
| gdpr_consent_at / *_opt_in_at | timestamptz | Consentimientos |
| do_not_contact | boolean | Compliance |
| ai_context_summary / ai_sentiment_score | text/numeric | Resumen IA |
| first_seen_at / last_seen_at / last_conversation_at | timestamptz | — |
| created_by_source | enum | inbound_message/manual/import_csv/nucleo_sync/... |
| created_at / updated_at / archived_at | timestamptz | — |

## Tabla `contact_channels`
`identifier_normalized` para búsqueda. `is_verified`, `is_primary`, `channel_metadata`, opt-in tracking.

## Tabla `contact_notes`
author_id, note, created_at.

## Tabla `tags`
name, color, tenant.

## Tabla `contact_tags` (N:M)
contact_id + tag_id. `applied_by_type` (human/ai_agent/system/automation).

## Tabla `segments`
criteria jsonb para segmentación dinámica.

## RLS
Tenant isolation estándar + heredado por join.