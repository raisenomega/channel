# Infraestructura — `AIProviderRegistry`

## Propósito
Resolver el `AIProvider` correcto por tenant según su configuración BYOK.

## Implementación
```ts
export class AIProviderRegistry {
  private readonly adapters = new Map<string, AIProvider>();

  registrar(a: AIProvider): void { this.adapters.set(a.provider, a); }

  async resolver(tenantId: string): Promise<Result<AIProvider, AIError>> {
    const config = await this.configRepo.obtener(tenantId);
    if (!config.ok) return err(config.error);

    const provider = config.value.provider;
    const adapter = this.adapters.get(provider);
    if (!adapter) return err({ kind: 'provider_no_soportado', provider });

    await adapter.ping(); // health check
    return ok(adapter);
  }
}
```

## BYOK (Bring Your Own Key)
El tenant configura vía UI:
1. Selecciona proveedor (anthropic/deepseek/qwen).
2. Pega su API key.
3. Opcional: modelo, max tokens, temperatura.
4. Se guarda cifrado en `ai_provider_configs.secrets_encrypted`.