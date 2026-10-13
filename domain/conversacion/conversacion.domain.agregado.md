# Dominio — Aggregate `ConversationAggregate`

## Raíz
`Conversation` es la raíz del agregado. Los mensajes se modifican solo vía la raíz.

## Límite de consistencia
`Conversation` + `Message[]` del hilo se tratan como una unidad transaccional.

## Operaciones de la raíz (todas `Result`)
- `recibirMensaje(msg)` — añade inbound, dispara `MessageReceived`.
- `enviarMensaje(msg)` — añade outbound, valida permisos/autonomía.
- `asignar(agentId)` — dispara `ConversationAssigned`.
- `resolver()` — dispara `ConversationResolved`.

## Regla de escritura
Ningún código fuera del agregado muta `Message` directamente.
Los efectos secundarios (entrega al canal) se emiten como eventos y se procesan
en `application`/`infrastructure`.

## Invariante de indistinguibilidad
Si el mensaje es de IA, el agregado exige `aiMeta.confidence` y `aiMeta.mode`.
