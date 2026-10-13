# Dominio — Aggregate `Order`

## Raíz
`Order` es la raíz; `OrderLineItem[]` se modifican vía la raíz.

## Estado
```ts
export interface OrderState {
  readonly id: OrderId;
  readonly tenantId: TenantId;
  readonly contactId: ContactId;
  readonly quoteId: QuoteId;
  readonly nucleoOrderId: string | null;
  readonly status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  readonly total: Money;
}
```

## Operaciones (todas `Result`)
- `marcarPagado()` — `pending → paid`.
- `cancelar()` — solo desde `pending`/`paid`.

## Invariantes
- Una orden nace de una cotización `accepted`.
- `total` inmutable tras creación; ajustes generan nueva versión.
