# Dominio — Entidad `Agent` (BC agents)

## Responsabilidad
Vista funcional de los usuarios (staff humano) que trabajan en HUB.

## Estado (inmutable)
```ts
export interface AgentState {
  readonly id: AgentId;
  readonly tenantId: TenantId;
  readonly userId: string;
  readonly name: string;
  readonly role: Role;          // owner / admin / agent / viewer
  readonly teamIds: readonly TeamId[];
}
```

## Nota (importante)
El agente IA **NO** es una fila de `agents`; vive en el BC `cognition/`
(`agent_interactions`, `agent_knowledge`, etc.). Los `agents` son humanos.

## Invariantes
- `role` determina permisos (ver `identidad.domain.rol.md`).
- Un agente puede pertenecer a 0..N `teams`.
