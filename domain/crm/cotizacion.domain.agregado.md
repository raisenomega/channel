# Dominio — Aggregate `Quote`

## Raíz
`Quote` es la raíz; sus `QuoteLineItem[]` se modifican solo vía la raíz.

## Estado
```ts
export interface QuoteState {
  readonly id: QuoteId;
  readonly tenantId: TenantId;
  readonly contactId: ContactId;
  readonly mode: 'lite' | 'nucleo_synced';
  readonly nucleoQuoteId: string | null;
  readonly status: QuoteStatus;
  readonly items: readonly QuoteLineItem[];
  readonly createdByType: 'human' | 'ai_agent';
  readonly aiInteractionId: string | null;
}
```

## Operaciones (todas `Result`)
- `agregarItem(item)` — recalcula total.
- `enviar()` — `draft → sent`.
- `aceptar()` — `sent → accepted`; genera `QuoteAccepted`.

## Invariantes
- Total = suma de `item.total` (sin drift de punto flotante).
- `mode = nucleo_synced` exige `nucleoQuoteId`.
