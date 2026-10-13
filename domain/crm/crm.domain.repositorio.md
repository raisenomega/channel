# Dominio — Contratos de Repositorio (CRM)

## `ContactRepository`
```ts
export interface ContactRepository {
  guardar(c: Contact): Promise<Result<void, RepoError>>;
  buscar(id: ContactId): Promise<Result<Contact | null, RepoError>>;
  porEmail(e: Email): Promise<Result<Contact | null, RepoError>>;
}
```

## `QuoteRepository`
```ts
export interface QuoteRepository {
  guardar(q: Quote): Promise<Result<void, RepoError>>;
  buscar(id: QuoteId): Promise<Result<Quote | null, RepoError>>;
}
```

## Reglas
- Interfaces puras en `domain`; implementación en `infrastructure/persistencia`.
- `Result` siempre; sin excepciones de infraestructura.
