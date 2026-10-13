# Data Schema — Identidad (completo de 01_HUB_Data_Schema.md)

## Tabla `tenants` (raíz, global)
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | — |
| name | text NOT NULL | Nombre |
| slug | text UNIQUE NOT NULL | URL-safe |
| legal_name | text | Nombre legal del negocio |
| tax_id | text | EIN/RFC/NIT según país |
| industry | text | Referencia a agent_vertical_templates |
| country_code | text DEFAULT 'PR' | ISO 3166-1 alpha-2 |
| region | text | Estado/provincia |
| city | text | Ciudad |
| timezone | text DEFAULT 'America/Puerto_Rico' | Zona horaria |
| plan | enum | lite_starter / lite_pro / lite_business / ecosystem / enterprise / inbox_addon |
| status | enum | trial / active / suspended / cancelled / churned |
| features_enabled | jsonb | Features activas (autonomous, graph_memory, integrations...) |
| branding_config | jsonb | White-label (colors, logo, domain, email_from) |
| nucleo_tenant_id | uuid | Sync NÚCLEO |
| omega_tenant_id | uuid | Sync OMEGA |
| pos_tenant_id | uuid | Sync POS |
| meta_business_manager_id | text | WhatsApp Business Manager |
| meta_verification_status | enum | pending / verified / rejected / not_started |
| stripe_customer_id | text | Stripe |
| mrr_usd | numeric | Monthly Recurring Revenue |
| churn_risk_score | numeric (0-1) | Riesgo de cancelación |
| created_at / updated_at | timestamptz | — |

## Tabla `users` (compartida ecosistema)
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK (↔ auth.users) | — |
| tenant_id | uuid FK → tenants | Tenant |
| email | text UNIQUE NOT NULL | — |
| full_name / display_name | text | Nombre |
| avatar_url | text | Foto |
| phone | text | Teléfono |
| role | enum | owner / admin / supervisor / agent / viewer / superadmin |
| permissions | jsonb | Permisos granulares por módulo |
| language / timezone | text | Preferencias |
| is_active / is_online | boolean | Estado |
| last_seen_at / last_login_at | timestamptz | — |
| onboarded_at / onboarding_completed_steps | jsonb | Progreso de onboarding |
| mfa_enabled | boolean | Seguridad |
| created_at / updated_at / archived_at | timestamptz | — |

## RLS
- `tenants`: superadmin ve todos; owner/admin ve suyo.
- `users`: tenant + admin manage own.