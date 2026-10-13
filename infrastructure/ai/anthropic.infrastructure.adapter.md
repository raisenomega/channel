# Infraestructura — Adapter `AnthropicAdapter`

## Proveedor
Anthropic Claude (LLM oficial del ecosistema Raisen). Modelo `claude-sonnet-4-6`.

## Responsabilidad
Implementar `AIProvider` con `provider = 'anthropic'`.

## Detalles
- SDK Anthropic Node.js. Los tokens se facturan pass-through al tenant.
- `completar()` construye el body con system prompt + messages + tools.
- Retorna tokens, latencia y costo calculado por modelo.

## Configuración
| Parámetro | Default |
|---|---|
| Modelo | claude-sonnet-4-6 |
| Max tokens | 4096 |
| Temperatura | 0.7 |

## BYOK
Si el tenant pega su propia API key de Anthropic, se usa esa.
Si no, usa la key de Raisen (incluida en el plan Ecosystem).