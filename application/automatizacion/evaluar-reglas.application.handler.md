# Aplicación — `EvaluarReglas` (Command)

## Comando (inmutable)
```ts
export interface EvaluarReglasCommand {
  readonly tenantId: string;
  readonly evento: DomainEvent;
}
```

## Handler (1 caso de uso)
```ts
export class EvaluarReglasHandler {
  constructor(private readonly reglas: AutomationRuleRepository) {}

  async ejecutar(cmd: EvaluarReglasCommand): Promise<Result<void, ReglasError>> {
    // 1. cargar reglas activas del tenant
    // 2. regla.evaluar(evento) → acciones (puro)
    // 3. encolar acciones para ejecución (side-effect en infra)
  }
}
```

## Regla
La evaluación es pura; la ejecución se registra en `automation_rule_executions`.
