# Dominio — Entidad `User`

## Estado (inmutable)
```ts
export interface UserState {
  readonly id: UserId;
  readonly tenantId: TenantId;
  readonly email: Email;
  readonly role: Role;
}
```

## Invariantes
- `email` es VO autovalidado.
- `role` determina permisos (ver `identidad.domain.rol.md`).
