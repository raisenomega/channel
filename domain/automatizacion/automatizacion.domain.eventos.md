# Dominio — Eventos de Automatización

## Eventos (inmutables)
```ts
export interface AutomationTriggered {
  readonly type: 'AutomationTriggered';
  readonly ruleId: string;
  readonly conversationId: string;
  readonly actions: readonly Action[];
}
```

## Reglas
- `evaluar()` es puro; la ejecución real ocurre en `application`/`infrastructure`.
- Cada ejecución se registra en `automation_rule_executions` (particionada).
