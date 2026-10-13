# Aplicación — `EscalarHumano` (Command)

## Comando (inmutable)
```ts
export interface EscalarHumanoCommand {
  readonly conversationId: string;
  readonly reason: string;
  readonly context: EscalationContext;
}
```

## Handler (1 caso de uso)
```ts
export class EscalarHumanoHandler {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly notifier: Notificador, // contrato
  ) {}

  async ejecutar(cmd: EscalarHumanoCommand): Promise<Result<void, EscalarError>> {
    // 1. desasignar agente IA
    // 2. asignar humano (regla: asignado > vertical > round-robin)
    // 3. notifier.avisar(agente, contexto completo)
  }
}
```

## Casos de escalación obligatoria (10)
Queja, emergencia, legal, pagos disputados, solicitud de humano, entre otros.
