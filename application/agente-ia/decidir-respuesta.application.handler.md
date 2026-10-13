# Aplicación — `DecidirRespuesta` (Command)

## Comando (inmutable)
```ts
export interface DecidirRespuestaCommand {
  readonly conversationId: string;
  readonly mensajeEntrante: MessageContent;
}
```

## Handler (1 caso de uso)
```ts
export class DecidirRespuestaHandler {
  constructor(
    private readonly motor: AgenteMotor,           // contrato (infra/OMEGA)
    private readonly autonomia: AutonomiaGateway,   // contrato
    private readonly knowledge: AgentKnowledgeRepository,
  ) {}

  async ejecutar(cmd: DecidirRespuestaCommand): Promise<Result<Decision, DecidirError>> {
    // 1. cargar AutonomyConfig (canal/horario)
    // 2. recuperar conocimiento (brand_voice, faq, product)
    // 3. motor.decidir(...) → acción + confianza
    // 4. aplicar umbrales de Confidence
    // 5. registrar AgentInteraction
  }
}
```

## Reglas
- `Confidence` 0.9 → actuar sin preguntar; 0.7 → actuar con confirmación;
  0.3 → sugerir con disclaimer; 0.0 → escalar (ver `domain/agente-ia/confianza`).
- Las 7 reglas inmutables se evalúan antes de decidir.
