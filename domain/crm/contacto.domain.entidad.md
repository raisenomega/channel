# Dominio — Entidad `Contact`

## Responsabilidad
Contacto con múltiples canales y trazabilidad hacia NÚCLEO/POS.

## Estado (inmutable)
```ts
export interface ContactState {
  readonly id: ContactId;
  readonly tenantId: TenantId;
  readonly displayName: string;
  readonly email: Email | null;
  readonly phone: Phone | null;
  readonly nucleoCustomerId: string | null;
  readonly posCustomerId: string | null;
  readonly createdAt: Date;
}
```

## Invariantes
- `email` y `phone` son VO autovalidados (no `string`).
- Al menos un canal de contacto presente (email o phone).
- `displayName` no vacío.

## Operaciones (devuelven `Result`)
- `agregarEmail(email)` — falla si ya existe.
- `vincularNucleo(id)` — setea `nucleoCustomerId`.
