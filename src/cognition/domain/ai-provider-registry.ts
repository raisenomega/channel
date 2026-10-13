import { Result } from "../../shared/domain/result.ts";
import { AIProvider, AICompletionParams, AICompletionResult, AIError, ProviderType } from "./ai-provider.ts";

/** Contrato del registro de proveedores IA. La implementacion vive en infrastructure. */
export interface AIProviderRegistry {
  registrar(a: AIProvider): void;
  resolver(provider: ProviderType): Result<AIProvider, RegistryError>;
  completarConFallback(
    primary: ProviderType,
    params: AICompletionParams,
  ): Promise<Result<AICompletionResult, AIError | RegistryError>>;
}

export type RegistryError = { readonly kind: "provider_no_registrado"; readonly provider: ProviderType };