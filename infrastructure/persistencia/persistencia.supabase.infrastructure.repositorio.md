# Infraestructura — Repositorios Supabase

## Responsabilidad
Implementar los contratos de repositorio de `domain` contra Supabase.

## Reglas
- Un repositorio por agregado (misma granularidad que el contrato).
- RLS del tenant se aplica en la capa de datos (`current_tenant()`).
- Traducir errores de PostgREST a `RepoError` tipado (no excepciones crudas).
- Sin lógica de negocio: solo mapeo entidad ↔ fila.

## Ejemplo (mapeo, no lógica)
```ts
export class ConversationRepositorySupabase implements ConversationRepository {
  async guardar(ag: ConversationAggregate): Promise<Result<void, RepoError>> {
    // mapea ConversationState → fila conversations + messages
  }
}
```

## Particionado
`messages` etc. usan pg_partman; el repositorio escribe con la clave de partición.
