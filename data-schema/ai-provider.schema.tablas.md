# Infraestructura — Tabla `ai_provider_configs`

## Propósito
Configuración del proveedor IA por tenant (BYOK).

## Tabla `ai_provider_configs` (nueva, en BC `integrations`)
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | Identificador |
| tenant_id | uuid FK → tenants | Tenant |
| provider | enum | anthropic / deepseek / qwen / openai |
| model | text | Modelo activo (claude-sonnet-4-6, deepseek-chat, qwen-72b) |
| secrets_encrypted | jsonb | API key cifrada (pgcrypto) |
| max_tokens | int | DEFAULT 4096 |
| temperature | real | DEFAULT 0.7 |
| fallback_provider | enum | Si el primario falla |
| is_active | boolean DEFAULT true | Habilitado |
| created_at | timestamptz | DEFAULT NOW() |

## RLS
`tenant_isolation_ai_provider_configs` (`tenant_id = current_tenant()`).

## Nota
`sanitize_credentials()` trigger impide loggear la API key en audit_logs.