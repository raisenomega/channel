# Dominio — Aggregate `Tenant`

## Raíz
`Tenant` es la raíz de identidad multi-tenant.

## Estado (inmutable)
```ts
export interface TenantState {
  readonly id: TenantId;
  readonly name: string;
  readonly slug: string;
  readonly featuresEnabled: ReadonlySet<string>;
}
```

## Operaciones (devuelven `Result`)
- `habilitarFeature(f)` / `deshabilitarFeature(f)`.
- `renombrar(name)`.

## Invariantes
- `slug` único y en formato URL-safe.
- `featuresEnabled` controla módulos (canales, IA, CRM).
