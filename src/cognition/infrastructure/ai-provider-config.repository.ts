import { Result, err, ok } from "../../shared/domain/result.ts";
import { AIProviderConfig } from "../domain/ai-provider.ts";
import { AIProviderRepository, RepoError } from "../domain/ai-provider.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export class AIProviderConfigRepositorySupabase implements AIProviderRepository {
  async obtenerConfig(tenantId: string): Promise<Result<AIProviderConfig, RepoError>> {
    try {
      const { data, error } = await supabase.from("ai_provider_configs").select("*")
        .eq("tenant_id", tenantId).eq("is_active", true).single();
      if (error) return err({ kind: "persistence_failure", cause: error.message });
      if (!data) return err({ kind: "not_found" });
      return ok(Object.freeze({
        provider: data.provider as AIProviderConfig["provider"],
        model: data.model as string,
        apiKey: "***", // secrets nunca salen del backend
        maxTokens: data.max_tokens as number,
        temperature: data.temperature as number,
        fallbackProvider: data.fallback_provider as AIProviderConfig["fallbackProvider"] ?? null,
      }));
    } catch (e) {
      return err({ kind: "persistence_failure", cause: String(e) });
    }
  }
}