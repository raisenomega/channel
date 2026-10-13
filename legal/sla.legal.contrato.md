# Legal — Contrato de Prestación de Servicios (SLA)

## Métricas
| Métrica | Objetivo | Crédito si incumple |
|---|---|---|
| Uptime del inbox (excluye canales externos caídos) | 99.5 % mensual | 5 % del mes |
| Latencia de envío de mensaje (infra HUB) | < 2s promedio | 5 % del mes |
| Latencia de respuesta IA autónoma | < 8s promedio | 5 % del mes |
| Disponibilidad de API pública | 99.5 % mensual | 10 % del mes |

## Excepciones
- Caídas de canales externos (Meta, Zernio, Resend, Twilio) no cuentan.
- Mantenimiento programado (> 2h/mes no contado).
- Kill switch manual por cliente no cuenta.

## Soporte
| Plan | Horario | Tiempo de respuesta |
|---|---|---|
| Lite | email, 24–48h laborables | — |
| Ecosystem | chat + email, 4–12h laborables | 8h |
| Enterprise | 24/7 telefónico + chat | 1h |
| Autonomous | incluye revisión semanal de métricas IA | 4h |