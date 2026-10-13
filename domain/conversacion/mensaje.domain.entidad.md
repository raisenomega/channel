# Dominio — Entidad `Message`

## Responsabilidad
Unidad atómica de contenido dentro de una conversación.

## Estado (inmutable)
```ts
export interface MessageState {
  readonly id: MessageId;
  readonly conversationId: ConversationId;
  readonly direction: MessageDirection;
  readonly content: MessageContent;
  readonly aiMeta: AiMeta | null;
  readonly createdAt: Date;
}
```

## Invariantes
- `direction` ∈ { inbound, outbound }.
- `content.body` no vacío para `contentType = text`.
- `aiMeta` presente si y solo si el mensaje fue generado por IA.

## Trazabilidad IA (`AiMeta`)
```ts
export interface AiMeta {
  readonly interactionId: string;
  readonly confidence: number;      // 0..1
  readonly mode: 'autonomous' | 'suggested' | 'off';
  readonly editedByHuman: boolean;
}
```

## Inmutabilidad
`MessageState` es `Readonly`; los cambios generan una nueva instancia.
