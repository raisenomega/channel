import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { TenantPlan } from "../../shared/domain/types.ts";

export interface TenantState {
  readonly id: TenantId;
  readonly name: string;
  readonly slug: string;
  readonly plan: TenantPlan;
  readonly countryCode: string;
  readonly timezone: string;
  readonly language: string;
  readonly featuresEnabled: Readonly<Record<string, unknown>>;
  readonly status: "trial" | "active" | "suspended" | "cancelled" | "churned";
  readonly createdAt: Date;
}

export type TenantCreateError =
  | { readonly kind: "slug_ya_existe" }
  | { readonly kind: "nombre_vacio" };

export const crearTenant = (
  name: string,
  slug: string,
  plan: TenantPlan,
): Result<TenantState, TenantCreateError> => {
  if (!name || name.trim().length === 0) {
    return err({ kind: "nombre_vacio" });
  }
  const state: TenantState = Object.freeze({
    id: crypto.randomUUID() as TenantId,
    name: name.trim(),
    slug: slug.trim().toLowerCase(),
    plan,
    countryCode: "PR",
    timezone: "America/Puerto_Rico",
    language: "es",
    featuresEnabled: Object.freeze({}),
    status: "active",
    createdAt: new Date(),
  });
  return ok(state);
};