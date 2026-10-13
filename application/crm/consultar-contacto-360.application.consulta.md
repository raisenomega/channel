# Aplicación — `ConsultarContacto360` (Query)

## Consulta (inmutable)
```ts
export interface ConsultarContacto360Query {
  readonly contactId: string;
}
```

## Handler (1 consulta)
```ts
export class ConsultarContacto360Handler {
  constructor(private readonly vista: Contact360ReadModel) {}

  async ejecutar(q: ConsultarContacto360Query): Promise<Result<Contacto360, QueryError>> {
    // retorna v_contact_360 (conversaciones + quotes + orders + payments + IA)
  }
}
```

## Proyección `Contacto360`
```ts
export interface Contacto360 {
  readonly contact: ContactState;
  readonly conversations: readonly InboxItem[];
  readonly quotes: readonly QuoteState[];
  readonly orders: readonly OrderState[];
  readonly aiInteractions: readonly AgentInteractionState[];
}
```
