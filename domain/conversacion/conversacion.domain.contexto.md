# Dominio — Conversación: Contexto

## Propósito
Núcleo del inbox unificado: una conversación por contacto+canal, con hilo de mensajes.

## Lenguaje ubicuo
- **Conversación**: hilo continuo entre un contacto y la empresa en un canal.
- **Mensaje**: unidad atómica de contenido (entrante/saliente).
- **Asignación**: responsabilidad de un agente (humano o IA) sobre la conversación.

## Invariantes
1. Una conversación pertenece a un único tenant e inbox.
2. Todo mensaje pertenece a una conversación existente.
3. Solo un agente activo por conversación en un instante dado.
4. Un mensaje saliente de IA registra siempre `ai_confidence` y `ai_mode`.

## Reglas de estado
`open → pending → resolved`; `snoozed` es transitorio y vuelve a `open` por timer.

## Dependencias
Solo `shared-kernel` (Result, errores). Cero infraestructura.
