# Aplicación — `ProcesarWebhook` (Command)

## Comando (inmutable)
```ts
export interface ProcesarWebhookCommand {
  readonly inboxId: string;
  readonly firma: string;
  readonly payload: Readonly<Record<string, unknown>>;
}
```

## Handler (1 caso de uso)
```ts
export class ProcesarWebhookHandler {
  constructor(
    private readonly verificador: WebhookVerifier,  // contrato
    private readonly normalizador: PayloadNormalizer, // contrato
    private readonly recibir: RecibirMensajeHandler,
  ) {}

  async ejecutar(cmd: ProcesarWebhookCommand): Promise<Result<void, WebhookError>> {
    // 1. verificador.verificar(firma, payload)
    // 2. normalizador.aMessage(payload) → MessageContent + handle
    // 3. recibir.ejecutar(...)
  }
}
```

## Reglas
- `WebhookVerifier` y `PayloadNormalizer` son contratos de `application`;
  las implementaciones por proveedor viven en `infrastructure/adapters`.
- Un webhook no verificado se descarta y registra en `webhook_failures`.
