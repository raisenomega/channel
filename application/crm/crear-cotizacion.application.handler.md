# Aplicación — `CrearCotizacion` (Command)

## Comando (inmutable)
```ts
export interface CrearCotizacionCommand {
  readonly contactId: string;
  readonly mode: 'lite' | 'nucleo_synced';
  readonly items: readonly QuoteLineItemInput[];
  readonly createdByType: 'human' | 'ai_agent';
  readonly aiInteractionId: string | null;
}
```

## Handler (1 caso de uso)
```ts
export class CrearCotizacionHandler {
  constructor(private readonly quotes: QuoteRepository) {}

  async ejecutar(cmd: CrearCotizacionCommand): Promise<Result<void, CotizarError>> {
    // 1. Quote.crear(...) (valida items y total)
    // 2. quotes.guardar(...)
    // 3. si ai_agent: emitir AiActionExecuted
  }
}
```

## Reglas
- `createdByType = 'ai_agent'` exige `aiInteractionId`.
- Total se calcula con `Money` (centavos), sin drift.
