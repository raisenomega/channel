/**
 * HUB by Raisen — AnthropicAdapter: completar con degradacion por tier.
 * Modelo resuelto dinamicamente por AnthropicModelResolver.
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import type { AIProvider, AICompletionParams, AICompletionResult, AIError } from "../domain/ai-provider.ts";
import { DEGRADATION_CHAIN } from "../domain/routing-table.ts";
import type { ModelTier } from "../domain/routing-table.ts";
import { usageDesde } from "../domain/model-pricing.ts";
import { AnthropicModelResolver } from "./anthropic-model-resolver.ts"; import { construirMensajes } from "./anthropic-messages.ts";

export class AnthropicAdapter implements AIProvider {
  readonly provider = "anthropic" as const;
  private readonly resolver: AnthropicModelResolver;
  private readonly apiKeyValue: string;

  constructor(apiKey: string) {
    this.apiKeyValue = apiKey;
    this.resolver = new AnthropicModelResolver(apiKey);
  }

  async completar(params: AICompletionParams): Promise<Result<AICompletionResult & { usedTier: ModelTier; usedModel: string }, AIError>> {
    const requestedTier = params.tier ?? "sonnet";
    let ultimo: AIError = { kind: "provider_unavailable", cause: "sin_modelo" };
    for (const tier of DEGRADATION_CHAIN[requestedTier]) {
      const modelRes = await this.resolver.resolverModelo(tier);
      if (!modelRes.ok) continue;
      const resp = await this.callAnthropic(modelRes.value, params);
      if (resp.ok) return ok({ ...resp.value, usedTier: tier, usedModel: modelRes.value } as AICompletionResult & { usedTier: ModelTier; usedModel: string });
      ultimo = resp.error;
      if (!this.esDeDisponibilidad(resp.error.kind)) return resp;
    }
    return err(ultimo);
  }

  async ping(): Promise<Result<boolean, AIError>> {
    try {
      const resp = await fetch("https://api.anthropic.com/v1/models");
      return ok(resp.ok);
    } catch { return err({ kind: "provider_unavailable" }); }
  }

  private esDeDisponibilidad(kind: string): boolean {
    return kind === "provider_unavailable" || kind === "rate_limited" || kind === "timeout";
  }

  private async callAnthropic(model: string, params: AICompletionParams): Promise<Result<AICompletionResult, AIError>> {
    const startMs = Date.now();
    try {
      const apiKey = this.apiKeyValue;
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" }, // caching GA: cache_control basta, sin header beta (evita 400 por beta retirado)
        body: JSON.stringify({
          model, system: params.cachedSystem
            ? [{ type: "text", text: params.cachedSystem, cache_control: { type: "ephemeral" } }, { type: "text", text: params.systemPrompt }]
            : params.systemPrompt,
          messages: construirMensajes(params),
          max_tokens: params.maxTokens ?? 4096,
        }),
      });
      if (resp.status === 503 || resp.status === 429) return err({ kind: "provider_unavailable", cause: `http_${resp.status}` });
      if (!resp.ok) { const b = await resp.text().catch(() => ""); return err({ kind: "provider_unavailable", cause: `http_${resp.status}:${b.slice(0, 180)}` }); }
      const data = await resp.json() as Record<string, unknown>;
      const blocks = (data.content as Array<{ type?: string; text?: string }>) ?? [];
      const text = blocks.filter((b) => b.type === "text" && b.text).map((b) => b.text).join("\n").trim();
      return ok(Object.freeze({
        response: text,
        ...usageDesde(data.usage as Record<string, number> | undefined, model),
        latencyMs: Date.now() - startMs, model,
      }));
    } catch (e) { return err({ kind: "unknown", cause: String(e) }); }
  }
}