# Aplicación — `AsignarConversacion` (Command)

## Comando (inmutable)
```ts
export interface AsignarConversacionCommand {
  readonly conversationId: string;
  readonly agentId: string;
}
```

## Handler (1 caso de uso)
```ts
export class AsignarConversacionHandler {
  constructor(private readonly conversations: ConversationRepository) {}

  async ejecutar(cmd: AsignarConversacionCommand): Promise<Result<void, AsignarError>> {
    // 1. cargar agregado
    // 2. raíz.asignar(agentId)
    // 3. guardar + emitir ConversationAssigned
  }
}
```

## Reglas de asignación
1. Agente asignado explícitamente > vertical > round-robin.
2. No se puede asignar una conversación `resolved`.

## Errores
```ts
export type AsignarError =
  | { kind: 'conversacion_resuelta' }
  | { kind: 'agente_no_encontrado' };
```
