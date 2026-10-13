# Aplicación — `RecibirMensaje` (Command)

## Comando (inmutable)
```ts
export interface RecibirMensajeCommand {
  readonly inboxId: string;
  readonly providerMessageId: string;
  readonly from: string;
  readonly content: MessageContent;
}
```

## Handler (1 caso de uso)
```ts
export class RecibirMensajeHandler {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly contacts: ContactRepository,
  ) {}

  async ejecutar(cmd: RecibirMensajeCommand): Promise<Result<void, RecibirError>> {
    // 1. ubicar/crear Contact por handle
    // 2. ubicar/crear Conversation por (inbox, contact)
    // 3. raíz.recibirMensaje(...)
    // 4. conversations.guardar(agregado)
    // 5. emitir MessageReceived (bus de eventos)
  }
}
```

## Dependencias
Solo contratos de `domain`. Cero infraestructura directa.

## Errores
```ts
export type RecibirError =
  | { kind: 'inbox_inactivo' }
  | { kind: 'contenido_invalido' };
```
