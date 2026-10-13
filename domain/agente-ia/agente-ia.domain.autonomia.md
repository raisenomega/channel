# Dominio — Value Object `AutonomyConfig`

## Responsabilidad
Autonomía granular por canal, horario y tipo de acción.

## Estado (inmutable)
```ts
export interface AutonomyConfig {
  readonly channel: ChannelType | 'all';
  readonly schedule: { readonly start: string; readonly end: string } | null;
  readonly allowedActions: readonly string[];
  readonly requiresHumanApproval: readonly string[];
}
```

## Reglas
- `requiresHumanApproval` ⊆ acciones críticas (pagos, reembolsos).
- Fuera de `schedule`, solo modo `suggested` (nunca `autonomous`).
- Kill switch parcial anula esta config por canal/horario.

## Validación
`AutonomyConfig.crear()` rechaza configs con acciones críticas sin aprobación.
