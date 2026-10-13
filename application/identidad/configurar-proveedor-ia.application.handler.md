# Aplicación — `ConfigurarProveedorIA` (Command)

## Comando (inmutable)
```ts
export interface ConfigurarProveedorIACommand {
  readonly tenantId: string;
  readonly provider: 'anthropic' | 'deepseek' | 'qwen';
  readonly model: string;
  readonly apiKey: string;          // se cifra en el handler
  readonly maxTokens: number;
  readonly temperature: number;
  readonly fallbackProvider: string | null;
}
```

## Handler (1 caso de uso)
```ts
export class ConfigurarProveedorIAHandler {
  constructor(private readonly configRepo: AIProviderConfigRepository) {}

  async ejecutar(cmd: ConfigurarProveedorIACommand): Promise<Result<void, ConfigError>> {
    // 1. validar provider soportado
    // 2. probar conectividad (ping)
    // 3. cifrar apiKey con pgcrypto
    // 4. guardar en ai_provider_configs
    // 5. invalidar cache del registry
  }
}
```

## Reglas
- El handler NO almacena la API key en texto plano.
- `ping()` se ejecuta antes de guardar (validación síncrona).
- `fallbackProvider` alterna si el primario da error 5xx.