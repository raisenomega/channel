import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId, UserId } from "../../shared/domain/ids.ts";
import { TenantPlan } from "../../shared/domain/types.ts";
import { Language } from "../../shared/domain/locale.vo.ts";

export interface TenantState {
  readonly id: TenantId;
  readonly name: string;
  readonly slug: string;
  readonly plan: TenantPlan;
  readonly countryCode: string;
  readonly timezone: string;
  readonly language: Language;
  readonly featuresEnabled: Readonly<Record<string, unknown>>;
  readonly status: "trial" | "active" | "suspended" | "cancelled" | "churned";
  readonly createdAt: Date;
}

export type TenantCreateError =
  | { readonly kind: "slug_ya_existe" }
  | { readonly kind: "nombre_vacio" }
  | { readonly kind: "idioma_invalido" };

export const crearTenant = (
  name: string,
  slug: string,
  plan: TenantPlan,
  language: Language = "es",
): Result<TenantState, TenantCreateError> => {
  if (!name || name.trim().length === 0) {
    return err({ kind: "nombre_vacio" });
  }
  const langs: readonly string[] = ["es", "en"];
  if (!langs.includes(language)) {
    return err({ kind: "idioma_invalido" });
  }
  const state: TenantState = Object.freeze({
    id: crypto.randomUUID() as TenantId,
    name: name.trim(),
    slug: slug.trim().toLowerCase(),
    plan,
    countryCode: "PR",
    timezone: "America/Puerto_Rico",
    language,
    featuresEnabled: Object.freeze({}),
    status: "active",
    createdAt: new Date(),
  });
  return ok(state);
};