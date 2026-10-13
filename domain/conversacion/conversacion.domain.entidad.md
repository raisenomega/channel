# Dominio — Entidad `Conversation`

## Responsabilidad
Representa el hilo de conversación con un contacto en un canal.

## Estado (inmutable)
```ts
export interface ConversationState {
  readonly id: ConversationId;
  readonly tenantId: TenantId;
  readonly inboxId: InboxId;
  readonly contactId: ContactId;
  readonly status: ConversationStatus;
  readonly assignedAgentId: AgentId | null;
  readonly isAiHandled: boolean;
  readonly createdAt: Date;
}
```

## Invariantes (autovalidados)
- `tenantId`, `inboxId`, `contactId` no vacíos.
- `status` siempre un valor del enum `ConversationStatus`.
- `assignedAgentId` solo presente si hay asignación.

## Operaciones (devuelven `Result`)
- `asignar(agentId)` — asigna agente; falla si ya resuelta.
- `resolver()` — cierra; falla si ya resuelta.
- `snoozear()` / `reabrir()` — transiciones transitorias.

## Inmutabilidad
Toda operación retorna una nueva `ConversationState` (nunca muta `this`).
