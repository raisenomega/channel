# Dominio — Entidad `AgentInteraction`

## Responsabilidad
Registro inmutable de un ciclo input→acción→resultado del agente.

## Estado (inmutable)
```ts
export interface AgentInteractionState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly conversationId: ConversationId;
  readonly input: string;
  readonly decidedAction: string;
  readonly confidence: Confidence;
  readonly wasCorrect: boolean | null;
  readonly escalatedToHuman: boolean;
  readonly indistinguishabilityScore: number;
  readonly createdAt: Date;
}
```

## Invariantes
- `confidence` es VO en [0,1].
- `wasCorrect` se resuelve post-envío (sampling) o por outcome humano.
- Una interacción es append-only (nunca se edita).

## Uso
Alimenta `agent_interactions` (particionada) y `v_ai_performance_daily`.
