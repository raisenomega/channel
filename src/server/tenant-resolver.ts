/**
 * HUB by Raisen — M-6: resolucion de tenant con fallback (Opcion ii, cierra D-37-bis).
 * Puro e inyectable (fallback como parametro) para ser testeable sin DB ni Deno:
 *   1) fast path: tenant_id del claim del JWT (app_metadata o raiz).
 *   2) fallback: sub -> public.users.tenant_id (lo inyecta el composition root).
 * C4 <=75.
 */
import type { JWTPayload } from "jose";
import { tenantIdDePayload } from "./jwt-verify.ts";

export async function resolverTenantId(
  payload: JWTPayload,
  fallback: (sub: string) => Promise<string | null>,
): Promise<string | null> {
  const claim = tenantIdDePayload(payload);
  if (claim) return claim;
  const sub = payload.sub;
  if (!sub) return null;
  return fallback(String(sub));
}
