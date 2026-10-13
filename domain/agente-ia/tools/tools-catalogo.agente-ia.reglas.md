# Agente IA — Estructura de Tools (precondiciones)

## Regla cross-tool
Cada tool tiene: definición formal con parámetros tipados, precondiciones,
postcondiciones, escalation triggers y confidence threshold.

## Ejemplo: `send_payment_link`
**Precondiciones** (todas deben cumplirse):
1. Existe un `order_id` válido en la BD.
2. El contacto tiene canal de contacto verificado.
3. El monto de la orden > $0 y < umbral del tenant.
4. La conversación no está bloqueada.
5. El agente tiene confidence > 0.7 sobre la corrección de la orden.

**Si falla CUALQUIER precondición** → escalar a humano con contexto completo.

## Confidence threshold por tool
| Tool | Mínimo para autónomo |
|---|---|
| send_message | 0.7 |
| create_quote | 0.9 |
| send_payment_link | 0.9 |
| escalate_to_human | 0.0 (siempre) |
| add_note | 0.3 |