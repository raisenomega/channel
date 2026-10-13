# Aplicación — `EnviarMensaje` (Command)

## Comando (inmutable)
```ts
export interface EnviarMensajeCommand {
  readonly conversationId: string;
  readonly content: MessageContent;
  readonly aiMeta: AiMeta | null;
}
```

## Handler (1 caso de uso)
```ts
export class EnviarMensajeHandler {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly canales: CanalGateway,
  ) {}

  async ejecutar(cmd: EnviarMensajeCommand): Promise<Result<void, EnviarError>> {
    // 1. cargar agregado
    // 2. raíz.enviarMensaje(content, aiMeta)
    // 3. conversations.guardar(agregado)
    // 4. canales.entregar(...) → side-effect (infra)
  }
}
```

## Regla de side-effect
`CanalGateway` es un contrato de `application` implementado en `infrastructure`.
La entrega física al proveedor ocurre fuera del dominio.

## Errores
```ts
export type EnviarError =
  | { kind: 'conversacion_resuelta' }
  | { kind: 'entrega_fallida'; cause: string };
```
