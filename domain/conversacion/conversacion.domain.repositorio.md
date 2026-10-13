# Dominio — Contrato `ConversationRepository`

## Definición (interfaz, sin implementación)
```ts
export interface ConversationRepository {
  guardar(ag: ConversationAggregate): Promise<Result<void, RepoError>>;
  buscar(id: ConversationId): Promise<Result<ConversationAggregate | null, RepoError>>;
  porContacto(contactId: ContactId): Promise<Result<ConversationAggregate[], RepoError>>;
}
```

## Reglas del contrato
- Es una interfaz pura en `domain`; la implementación vive en `infrastructure/persistencia`.
- Devuelve `Result`, nunca lanza excepciones de infraestructura al dominio.
- No filtra detalles de Supabase/PostgreSQL.

## Errores
```ts
export type RepoError =
  | { kind: 'not_found' }
  | { kind: 'persistence_failure'; cause: string };
```

## Inversión de dependencia
`application` depende de este contrato; `infrastructure` lo implementa.
Ninguna flecha inversa.
