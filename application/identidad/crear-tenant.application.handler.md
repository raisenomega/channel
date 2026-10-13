# Aplicación — `CrearTenant` (Command)

## Comando (inmutable)
```ts
export interface CrearTenantCommand {
  readonly name: string;
  readonly slug: string;
  readonly ownerEmail: Email;
}
```

## Handler (1 caso de uso)
```ts
export class CrearTenantHandler {
  constructor(private readonly tenants: TenantRepository) {}

  async ejecutar(cmd: CrearTenantCommand): Promise<Result<void, TenantError>> {
    // 1. Tenant.crear(name, slug)
    // 2. User owner con role='owner'
    // 3. persistir tenant + owner en transacción
  }
}
```

## Reglas
- `slug` único (URL-safe).
- El primer usuario es siempre `owner`.
