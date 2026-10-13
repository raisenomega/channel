# Dominio — Contrato `InboxRepository`

## Definición
```ts
export interface InboxRepository {
  guardar(inbox: Inbox): Promise<Result<void, RepoError>>;
  buscar(id: InboxId): Promise<Result<Inbox | null, RepoError>>;
  porTenant(tenantId: TenantId): Promise<Result<Inbox[], RepoError>>;
}
```

## Reglas
- Interfaz pura en `domain`; implementación en `infrastructure/persistencia`.
- No expone detalles de Supabase.
- Devuelve `Result`; nunca lanza excepciones de infra.

## Errores
```ts
export type RepoError =
  | { kind: 'not_found' }
  | { kind: 'persistence_failure'; cause: string };
```
