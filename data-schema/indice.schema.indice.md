# Data Schema — Índice (16 BCs con tablas)

> Fuente: `01_HUB_Data_Schema.md`. 42 tablas + 3 vistas + helpers + extensiones.

## Distribución por BC
| BC | Tablas | Archivo |
|---|---|---|
| identity/tenant | tenants, users | `identidad.schema.tablas.md` |
| agents & teams | agents, teams, agent_teams | `equipos.schema.tablas.md` |
| channels | inboxes, webhook_provider_configs | `canal.schema.tablas.md` |
| contacts | contacts, contact_channels, contact_notes, tags, contact_tags, segments | `crm.schema.tablas.md` |
| conversations | conversations, conversation_tags, conversation_participants | `conversacion.schema.tablas.md` |
| messages | messages, message_attachments, message_reactions | `mensaje.schema.tablas.md` |
| quotes | quotes, quote_line_items | `cotizacion.schema.tablas.md` |
| orders | orders, order_line_items | `orden.schema.tablas.md` |
| payments | payments, payment_methods_config | `pago.schema.tablas.md` |
| automation | automation_rules, automation_rule_executions, canned_responses | `automatizacion.schema.tablas.md` |
| business_hours & SLA | business_hours, sla_policies | `horario.schema.tablas.md` |
| templates_whatsapp | whatsapp_templates | `whatsapp.schema.tablas.md` |
| cognition | 7 tablas (referencia) | `cognition.schema.tablas.md` |
| audit | audit_logs, webhook_events, webhook_failures | `auditoria.schema.tablas.md` |
| notifications | internal_notifications | `notificacion.schema.tablas.md` |
| integrations | integration_configs, integration_sync_logs | `integracion.schema.tablas.md` |

## Vistas
`v_inbox_conversations`, `v_ai_performance_daily`, `v_contact_360` → `vistas.schema.vistas.md`.

## Convenciones globales
→ `schema.shared.convenciones.md`
