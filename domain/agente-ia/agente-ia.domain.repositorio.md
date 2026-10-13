# Dominio — Contratos de Repositorio (Agente IA)

## `AgentInteractionRepository`
```ts
export interface AgentInteractionRepository {
  guardar(i: AgentInteraction): Promise<Result<void, RepoError>>;
  porConversacion(id: ConversationId): Promise<Result<AgentInteraction[], RepoError>>;
}
```

## `AgentKnowledgeRepository`
```ts
export interface AgentKnowledgeRepository {
  buscar(cat: KnowledgeCategory): Promise<Result<AgentKnowledge[], RepoError>>;
  upsert(k: AgentKnowledge): Promise<Result<void, RepoError>>;
}
```

## Reglas
- Interfaces puras en `domain`; persistencia (incl. `pgvector`) en `infrastructure`.
- El dominio no conoce `pgvector` ni OMEGA.
