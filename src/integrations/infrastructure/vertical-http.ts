import { Result, err, ok } from "../../shared/domain/result.ts";
import type { IntegracionError } from "../domain/integration.gateways.ts";

/** Peticion POST JSON minimalista para los adaptadores verticales. */
export async function postJson<T>(
  url: string,
  body: Record<string, unknown>,
  onFail: IntegracionError,
): Promise<Result<T, IntegracionError>> {
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) return err(onFail);
    return ok(await resp.json() as T);
  } catch {
    return err({ kind: "provider_unavailable" });
  }
}

/** Peticion GET con tenant en cabecera. */
export async function getJson<T>(
  url: string,
  tenantId: string,
): Promise<Result<T, IntegracionError>> {
  try {
    const resp = await fetch(url, { headers: { "X-Tenant-Id": tenantId } });
    if (!resp.ok) return err({ kind: "provider_unavailable" });
    return ok(await resp.json() as T);
  } catch {
    return err({ kind: "provider_unavailable" });
  }
}