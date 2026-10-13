# Infraestructura — Contrato `AIProvider`

## Propósito
Abstraer el LLM: el BC `cognition/` nunca conoce el proveedor concreto.
El tenant elige su proveedor y pega su API key desde configuración.

## Contrato (interfaz, en `domain/cognition/`)
```ts
export interface AIProvider {
  readonly provider: 'anthropic' | 'deepseek' | 'qwen';

  completar(params: AICompletionParams): Promise<Result<AICompletionResult, AIError>>;
  ping(): Promise<Result<HealthStatus, HealthError>>;
}

export interface AICompletionParams {
  readonly systemPrompt: string;
  readonly messages: readonly Message[];
  readonly tools: readonly ToolDef[] | null;
  readonly maxTokens?: number;
}

export interface AICompletionResult {
  readonly response: string;
  readonly tokensInput: number;
  readonly tokensOutput: number;
  readonly latencyMs: number;
  readonly costUsd: number;
}
```

## Reglas
- Cada adapter implementa un solo `provider`.
- `AIProviderRegistry` resuelve por tenant.
- Costo se calcula por modelo (pass-through al cliente).