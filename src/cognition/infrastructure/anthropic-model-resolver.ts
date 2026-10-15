/**
 * HUB by Raisen — Resolver de modelo Anthropic por tier (cache 24h).
 * Query /v1/models + fallback safety net pinned. C4 ≤75 lineas.
 */
import { Result, ok } from "../../shared/domain/result.ts";
import type { AIError } from "../domain/ai-provider.ts";
import type { ModelTier } from "../domain/routing-table.ts";

const CACHE_TTL_MS = 24 * 3600 * 1000;
const SAFETY_NET: Record<ModelTier, string> = {
  opus: "claude-opus-4-5",   // SAFETY_NET pinned
  sonnet: "claude-sonnet-4-5", // SAFETY_NET pinned
  haiku: "claude-haiku-4-5",   // SAFETY_NET pinned
};

export class AnthropicModelResolver {
  private readonly cache = new Map<ModelTier, { model: string; expiresAt: number }>();

  constructor(private readonly apiKey: string) {}

  async resolverModelo(tier: ModelTier): Promise<Result<string, AIError>> {
    const cached = this.cache.get(tier);
    if (cached && cached.expiresAt > Date.now()) return ok(cached.model);
    await this.consultarModelos(tier);
    const fresh = this.cache.get(tier);
    return fresh ? ok(fresh.model) : ok(SAFETY_NET[tier]);
  }

  private async consultarModelos(tier: ModelTier): Promise<void> {
    try {
      const resp = await fetch("https://api.anthropic.com/v1/models",
        { headers: { "x-api-key": this.apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" } });
      if (!resp.ok) { this.cache.set(tier, { model: SAFETY_NET[tier], expiresAt: Date.now() + CACHE_TTL_MS }); return; }
      const data = await resp.json() as { data: Array<{ id: string; created_at: string }> };
      const latest = this.pickLatestForTier(data.data ?? [], tier);
      this.cache.set(tier, { model: latest ?? SAFETY_NET[tier], expiresAt: Date.now() + CACHE_TTL_MS });
    } catch {
      this.cache.set(tier, { model: SAFETY_NET[tier], expiresAt: Date.now() + CACHE_TTL_MS });
    }
  }

  private pickLatestForTier(models: Array<{ id: string; created_at: string }>, tier: ModelTier): string | null {
    const candidates = models
      .filter((m) => m.id.toLowerCase().includes(tier) && !/(deprecated|legacy)/.test(m.id.toLowerCase()))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return candidates.length > 0 ? (candidates[0]?.id ?? null) : null;
  }
}