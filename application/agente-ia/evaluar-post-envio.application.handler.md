# Aplicación — `EvaluarPostEnvio` (Command, SAFE)

## Comando (inmutable)
```ts
export interface EvaluarPostEnvioCommand {
  readonly interactionId: string;
  readonly outcome: 'correcto' | 'incorrecto' | 'requiere_ajuste';
}
```

## Handler (1 caso de uso)
```ts
export class EvaluarPostEnvioHandler {
  constructor(private readonly interactions: AgentInteractionRepository) {}

  async ejecutar(cmd: EvaluarPostEnvioCommand): Promise<Result<void, EvaluarError>> {
    // 1. marcar wasCorrect según outcome
    // 2. alimentar macro-learning si procede
  }
}
```

## Gobernanza SAFE
- Pre-envío: síncrono para acciones críticas (2–4s latencia aceptable).
- Post-envío: async con sampling 10 %.
