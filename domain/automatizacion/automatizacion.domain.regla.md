# Dominio — Aggregate `AutomationRule`

## Raíz
`AutomationRule` es la raíz; sus ejecuciones son eventos, no hijos mutables.

## Estado (inmutable)
```ts
export interface AutomationRuleState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly trigger: 'message_received' | 'tag_added' | 'sla_breach' | 'scheduled';
  readonly conditions: readonly Condition[];
  readonly actions: readonly Action[];
  readonly isActive: boolean;
}
```

## Operaciones (devuelven `Result`)
- `activar()` / `desactivar()`.
- `evaluar(evento)` — retorna acciones a ejecutar (puro, sin side-effects).

## Invariantes
- Toda regla tiene al menos una acción.
- Las acciones críticas requieren `requiresHumanApproval`.
