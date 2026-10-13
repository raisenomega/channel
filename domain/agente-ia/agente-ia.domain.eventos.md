# Dominio — Eventos del Agente IA

## Eventos (inmutables)
```ts
export interface AiEscalatedToHuman {
  readonly type: 'AiEscalatedToHuman';
  readonly conversationId: string;
  readonly reason: string;
  readonly context: EscalationContext;
}

export interface AiActionExecuted {
  readonly type: 'AiActionExecuted';
  readonly interactionId: string;
  readonly action: string;
  readonly confidence: number;
}
```

## `EscalationContext`
```ts
export interface EscalationContext {
  readonly sentimentTrend: string;
  readonly recommendedAction: string;
  readonly lastMessages: readonly string[];
}
```

## Reglas
- `AiEscalatedToHuman` lleva contexto completo (nunca parcial).
- El agente aprende del outcome del humano (no abandona la conversación).
