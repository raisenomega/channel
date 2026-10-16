/**
 * HUB by Raisen — Policy Guard (Slide 4.1, domain puro, sin IO).
 * Valida pre-ejecución de tools. Función pura, nunca throw. C4 ≤75.
 */
import type { ToolSpec } from "./tool.registry.core.ts";
import { Result, ok, err } from "../../shared/domain/result.ts";

export type TenantTier = "esencial" | "pro" | "business" | "enterprise";
export type ModoOperacion = "copiloto" | "confianza" | "autonomo";

export type PolicyRejection =
  | { readonly kind: "TIER_INSUFICIENTE"; readonly spec_min: TenantTier; readonly tenant: TenantTier }
  | { readonly kind: "SIN_PUERTA_PAGO"; readonly plataforma: "nucleo" | "omega" }
  | { readonly kind: "MUTADOR_EN_COPILOTO"; readonly tool: string }
  | { readonly kind: "ACCION_PROHIBIDA"; readonly accion: string };

export interface PolicyContext {
  readonly tenantTier: TenantTier;
  readonly modo: ModoOperacion;
  readonly puertasAbiertas: ReadonlyArray<"nucleo" | "omega">;
}

const TIER_ORDER: ReadonlyArray<TenantTier> = Object.freeze(["esencial", "pro", "business", "enterprise"]);

function tierIndex(t: TenantTier): number {
  return TIER_ORDER.indexOf(t);
}

export function evaluarPolicy(spec: ToolSpec, ctx: PolicyContext): Result<void, PolicyRejection> {
  if (spec.accion && spec.accion.startsWith("__prohibida__")) {
    return err({ kind: "ACCION_PROHIBIDA", accion: spec.accion });
  }
  if (tierIndex(ctx.tenantTier) < tierIndex(spec.min_tier_permitido)) {
    return err({ kind: "TIER_INSUFICIENTE", spec_min: spec.min_tier_permitido, tenant: ctx.tenantTier });
  }
  if (spec.requiere_puerta_pago !== null && !ctx.puertasAbiertas.includes(spec.requiere_puerta_pago)) {
    return err({ kind: "SIN_PUERTA_PAGO", plataforma: spec.requiere_puerta_pago });
  }
  if (spec.es_mutador && ctx.modo === "copiloto") {
    return err({ kind: "MUTADOR_EN_COPILOTO", tool: spec.nombre });
  }
  return ok(undefined);
}