# Seguridad — Plan de Continuidad de Negocio (BCP)

## Objetivo
Mantener operación del inbox ante interrupciones. Activo primario: conversaciones.

## Escenarios de contingencia
| Escenario | Impacto | Respuesta |
|---|---|---|
| Zernio cae | Sin canales sociales (WhatsApp/IG/FB/TG/SMS/X/LI) | Cambiar a Meta Direct/Twilio directo (feature flag) o notificar "caída del proveedor" |
| Resend cae | Sin email | Cambiar a Postmark (feature flag) |
| Anthropic cae | Sin modo autónomo (modo manual funciona) | Fallback a DeepSeek/Qwen si configurado, o desactivar autonomía |
| Supabase cae | Sin acceso a datos ni inbox | Failover Railway + réplica de Supabase (ver DRP) |
| Railway cae | Sin workers ni crons | Workers en contingencia local (manual) |

## Prioridades de recuperación
1. Inbox (lectura de conversaciones activas) — RTO: 1h.
2. Envío de mensajes — RTO: 2h.
3. Modo autónomo IA — RTO: 4h.
4. Reportes y analytics — RTO: 24h.