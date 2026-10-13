# Aplicación — `AceptarCotizacion` (Command)

## Comando (inmutable)
```ts
export interface AceptarCotizacionCommand {
  readonly quoteId: string;
}
```

## Handler (1 caso de uso)
```ts
export class AceptarCotizacionHandler {
  constructor(
    private readonly quotes: QuoteRepository,
    private readonly orders: OrderRepository,
  ) {}

  async ejecutar(cmd: AceptarCotizacionCommand): Promise<Result<void, AceptarError>> {
    // 1. cargar Quote
    // 2. quote.aceptar()
    // 3. Order.crear(quote) → nueva orden
    // 4. persistir ambos en transacción
  }
}
```

## Regla
Aceptar genera `QuoteAccepted` y crea la `Order` en la misma unidad de trabajo.
