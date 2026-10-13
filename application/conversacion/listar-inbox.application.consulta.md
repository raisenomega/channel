# Aplicación — `ListarInbox` (Query)

## Consulta (inmutable)
```ts
export interface ListarInboxQuery {
  readonly tenantId: string;
  readonly estado: ConversationStatus | 'todos';
  readonly asignadoA: string | null;
}
```

## Handler (1 consulta)
```ts
export class ListarInboxHandler {
  constructor(private readonly inbox: InboxReadModel) {}

  async ejecutar(q: ListarInboxQuery): Promise<Result<InboxItem[], QueryError>> {
    // 1. filtrar por tenant + estado + agente
    // 2. retornar proyección v_inbox_conversations
  }
}
```

## Reglas CQRS
- Queries no mutan estado (read-only).
- Usan read model (`v_inbox_conversations`), no el agregado completo.

## Proyección `InboxItem`
```ts
export interface InboxItem {
  readonly conversationId: string;
  readonly contactName: string;
  readonly channelType: ChannelType;
  readonly lastMessage: string;
  readonly lastMessageAt: Date;
}
```
