# Dominio — Value Objects de Mensaje

## `MessageContent`
```ts
export interface MessageContent {
  readonly type: 'text' | 'image' | 'audio' | 'video' | 'file' | 'template';
  readonly body: string;
}
```

## `MessageDirection`
```ts
export type MessageDirection = 'inbound' | 'outbound';
```

## Regla de validación
`MessageContent.crear()` retorna `Result<MessageContent, MessageError>`:
- `type = text` exige `body` no vacío.
- `type` distinto de `text` exige `body` = URL de recurso.

## Errores tipados
```ts
export type MessageError =
  | { kind: 'empty_body' }
  | { kind: 'invalid_content_type' };
```

## Uso
```ts
const r = MessageContent.crear({ type: 'text', body: 'Hola' });
if (r.ok) { /* r.value: MessageContent */ }
```
