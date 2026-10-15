/**
 * HUB by Raisen — Value Object de slug de tenant (Slide 3.3).
 * Regex: ^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$ — 3 a 64 chars slug-safe.
 * Valida el slug que aparece en la URL pública /pay/:slug/:orderId. C4 ≤40.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";

const SLUG_RX = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

export type SlugError = { readonly kind: "slug_invalido" };

export interface Slug {
  readonly value: string;
}

export const crearSlug = (input: string): Result<Slug, SlugError> => {
  const normalized = input.trim().toLowerCase();
  if (normalized.length < 3 || normalized.length > 64) return err({ kind: "slug_invalido" });
  if (!SLUG_RX.test(normalized)) return err({ kind: "slug_invalido" });
  return ok(Object.freeze({ value: normalized }));
};