import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
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
  /** Telefono del negocio E.164 (K-5-bis + migracion 045). null si aun no se capturo. */
  readonly phone: string | null;
  /** Zernio profile ID per-tenant (O-5 + migracion 049). null hasta ensureProfileForTenant. */
  readonly zernioProfileId: string | null;
  readonly featuresEnabled: Readonly<Record<string, unknown>>;
  readonly status: "trial" | "active" | "suspended" | "cancelled" | "churned";
  readonly createdAt: Date;
}

export type TenantCreateError =
  | { readonly kind: "slug_ya_existe" }
  | { readonly kind: "nombre_vacio" }
  | { readonly kind: "idioma_invalido" }
  | { readonly kind: "telefono_invalido" };

const E164_RE = /^\+[1-9]\d{6,14}$/;

/** R-3: valida telefono E.164 (reusa el patron de 045). Vacio = invalido (el caller decide opcionalidad). */
export const esTelefonoE164 = (phone: string): boolean => E164_RE.test(phone.trim());

/** S-1 (#95): planes validos runtime (espejo exacto del CHECK de migracion 050). */
export const PLANES_VALIDOS: readonly TenantPlan[] = ["esencial", "pro", "business", "ecosystem", "enterprise"];
export const esPlanValido = (plan: string): plan is TenantPlan => (PLANES_VALIDOS as readonly string[]).includes(plan);

export const crearTenant = (
  name: string,
  slug: string,
  plan: TenantPlan,
  language: Language = "es",
  countryCode = "PR",
  timezone = "America/Puerto_Rico",
  phone = "",
): Result<TenantState, TenantCreateError> => {
  if (!name || name.trim().length === 0) {
    return err({ kind: "nombre_vacio" });
  }
  const langs: readonly string[] = ["es", "en"];
  if (!langs.includes(language)) {
    return err({ kind: "idioma_invalido" });
  }
  const tel = phone.trim();
  if (tel && !E164_RE.test(tel)) {
    return err({ kind: "telefono_invalido" });
  }
  const state: TenantState = Object.freeze({
    id: crypto.randomUUID() as TenantId,
    name: name.trim(),
    slug: slug.trim().toLowerCase(),
    plan,
    countryCode,
    timezone,
    language,
    phone: tel || null,
    zernioProfileId: null,
    featuresEnabled: Object.freeze({}),
    status: "active",
    createdAt: new Date(),
  });
  return ok(state);
};