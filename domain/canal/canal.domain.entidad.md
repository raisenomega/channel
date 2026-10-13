# Dominio — Entidad `Inbox`

## Responsabilidad
Representa un canal conectado para un tenant.

## Estado (inmutable)
```ts
export interface InboxState {
  readonly id: InboxId;
  readonly tenantId: TenantId;
  readonly channelType: ChannelType;
  readonly name: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
}
```

## Invariantes
- `channelType` válido según el enum.
- `name` no vacío.
- `isActive = false` inhabilita recepción y envío.

## Operaciones (devuelven `Result`)
- `activar()` / `desactivar()`.
- `renombrar(name)` — valida longitud mínima.

## Inmutabilidad
Operaciones retornan nuevo `InboxState`; nunca mutan `this`.
