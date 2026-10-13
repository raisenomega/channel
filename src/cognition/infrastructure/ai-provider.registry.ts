import { Result, err, ok } from "../../shared/domain/result.ts";
import { AIProvider, AICompletionParams, AICompletionResult, AIError, ProviderType } from "../domain/ai-provider.ts";
import { AIProviderRegistry, RegistryError } from "../domain/ai-provider-registry.ts";

export type { RegistryError } from "../domain/ai-provider-registry.ts";

export class AIProviderRegistryImpl implements AIProviderRegistry {
  private readonly adapters = new Map<ProviderType, AIProvider>();

  registrar(a: AIProvider): void {
    this.adapters.set(a.provider, a);
  }

  resolver(provider: ProviderType): Result<AIProvider, RegistryError> {
    const a = this.adapters.get(provider);
    if (!a) return err({ kind: "provider_no_registrado", provider });
    return ok(a);
  }

  async completarConFallback(
    primary: ProviderType,
    params: AICompletionParams,
  ): Promise<Result<AICompletionResult, AIError | RegistryError>> {
    const adapterResult = this.resolver(primary);
    if (!adapterResult.ok) return err(adapterResult.error);
    return adapterResult.value.completar(params);
  }
}