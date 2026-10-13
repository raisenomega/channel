# Aplicación — `ConectarCanal` (Command)

## Comando (inmutable)
```ts
export interface ConectarCanalCommand {
  readonly tenantId: string;
  readonly channelType: ChannelType;
  readonly name: string;
  readonly providerConfig: Readonly<Record<string, unknown>>;
}
```

## Handler (1 caso de uso)
```ts
export class ConectarCanalHandler {
  constructor(
    private readonly inboxes: InboxRepository,
    private readonly conector: CanalConnector, // contrato
  ) {}

  async ejecutar(cmd: ConectarCanalCommand): Promise<Result<void, ConectarError>> {
    // 1. crear Inbox (VO ChannelType validado)
    // 2. conector.verificar(config) → handshake proveedor
    // 3. inbox.activar() + guardar
    // 4. emitir ChannelConnected
  }
}
```

## Reglas
- El handshake con el proveedor ocurre vía `CanalConnector` (infra).
- Los secretos se almacenan cifrados; nunca en el comando ni en el dominio.
