# Aplicación — `ResolverConversacion` (Command)

## Comando (inmutable)
```ts
export interface ResolverConversacionCommand {
  readonly conversationId: string;
  readonly resumen: string;
}
```

## Handler (1 caso de uso)
```ts
export class ResolverConversacionHandler {
  constructor(private readonly conversations: ConversationRepository) {}

  async ejecutar(cmd: ResolverConversacionCommand): Promise<Result<void, ResolverError>> {
    // 1. cargar agregado
    // 2. raíz.resolver()
    // 3. guardar + emitir ConversationResolved
  }
}
```

## Reglas
- `resumen` es opcional; si llega, se adjunta al registro de cierre.
- `resolved` es terminal salvo reapertura por mensaje entrante.

## Errores
```ts
export type ResolverError = { kind: 'ya_resuelta' };
```
