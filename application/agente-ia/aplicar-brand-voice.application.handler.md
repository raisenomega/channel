# Aplicación — `AplicarBrandVoice` (Command)

## Comando (inmutable)
```ts
export interface AplicarBrandVoiceCommand {
  readonly tenantId: string;
  readonly texto: string;
}
```

## Handler (1 caso de uso)
```ts
export class AplicarBrandVoiceHandler {
  constructor(private readonly omega: OmegaGateway) {}

  async ejecutar(cmd: AplicarBrandVoiceCommand): Promise<Result<string, VoiceError>> {
    // 1. omega.obtenerBrandVoice(tenantId) (cache 1h)
    // 2. transformar texto con tono/frases/prohibiciones
    // 3. retornar texto en Brand Voice
  }
}
```

## Invalidación de cache
Evento `omega.brand_voice.updated` invalida la caché del tenant.
