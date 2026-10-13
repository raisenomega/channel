# Seguridad — Plan de Respuesta a Incidentes

## Clasificación
| Nivel | Ejemplo | Respuesta |
|---|---|---|
| **Leve** | Prompt injection detectado (bloqueado por sanitización) | Log, revisión semanal |
| **Moderado** | Intento de acceso cross-tenant (bloqueado por RLS) | Alerta al owner, auditoría FORTRESS |
| **Grave** | Brecha de datos de un tenant | Notificar al tenant (≤72h), post-mortem, FORTRESS |
| **Crítico** | Brecha multi-tenant o fuga de API keys | Notificar a todos los tenants, activar DRP, kill switch total |

## Protocolo
1. **Detección** — Sentry, FORTRESS, reporte de cliente.
2. **Contención** — desactivar feature afectada, kill switch parcial/total.
3. **Investigación** — revisar audit_logs, webhook_events, agent_interactions.
4. **Notificación** — al cliente (≤72h si breach), a los reguladores (si aplica).
5. **Remediación** — parche, revisión de RLS, rotación de credenciales.
6. **Post-mortem** — informe público si aplica, registrado en SOURCE_OF_TRUTH.