/**
 * HUB by Raisen — Model Router wrapper (Slide 4.1, application layer).
 * Resuelve persona -> tier -> modelo concreto con degradación + safety net.
 * Usa AnthropicModelResolver existente. C4 ≤75.
 */
import { PERSONA_ROUTING, DEGRADATION_CHAIN } from "../domain/routing-table.ts";
import type { ModelTier } from "../domain/routing-table.ts";
import type { AnthropicModelResolver } from "../infrastructure/anthropic-model-resolver.ts";
import { Result, ok, err } from "../../shared/domain/result.ts";

const SAFETY_MODEL = "claude-haiku-4-5";

export type RouterError = { readonly kind: "PERSONA_DESCONOCIDA"; readonly slug: string };

export interface ResolvedRoute {
  readonly persona: string;
  readonly tier_declarado: ModelTier;
  readonly tier_usado: ModelTier;
  readonly modelo_concreto: string;
  readonly degradado: boolean;
}

export class ToolRouter {
  constructor(private readonly resolver: AnthropicModelResolver) {}

  async resolverRuta(personaSlug: string): Promise<Result<ResolvedRoute, RouterError>> {
    const tierDeclarado = PERSONA_ROUTING[personaSlug];
    if (!tierDeclarado) return err({ kind: "PERSONA_DESCONOCIDA", slug: personaSlug });
    for (const tierCandidato of DEGRADATION_CHAIN[tierDeclarado]) {
      const r = await this.resolver.resolverModelo(tierCandidato);
      if (r.ok) {
        return ok(Object.freeze({
          persona: personaSlug,
          tier_declarado: tierDeclarado,
          tier_usado: tierCandidato,
          modelo_concreto: r.value,
          degradado: tierCandidato !== tierDeclarado,
        }));
      }
    }
    const safety = await this.resolver.resolverModelo("haiku");
    return ok(Object.freeze({
      persona: personaSlug,
      tier_declarado: tierDeclarado,
      tier_usado: "haiku",
      modelo_concreto: safety.ok ? safety.value : SAFETY_MODEL,
      degradado: true,
    }));
  }
}