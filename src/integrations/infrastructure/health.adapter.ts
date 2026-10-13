import { Result, ok, err } from "../../shared/domain/result.ts";
import { ContactId, TenantId } from "../../shared/domain/ids.ts";
import { HEALTHGateway, IntegracionError } from "../domain/integration.gateways.ts";
import { postJson } from "./vertical-http.ts";

export class HealthAdapter implements HEALTHGateway {
  async buscarSesiones(tenantId: TenantId, professionalId: string, dateRange: string): Promise<Result<Record<string, unknown>[], IntegracionError>> {
    return postJson<Record<string, unknown>[]>("https://api.health.raisen/v1/sessions", { tenantId, professionalId, dateRange }, { kind: "provider_unavailable" });
  }

  async agendarSesion(tenantId: TenantId, professionalId: string, datetime: string, contactId: ContactId): Promise<Result<string, IntegracionError>> {
    const r = await postJson<Record<string, unknown>>("https://api.health.raisen/v1/sessions", { tenantId, professionalId, datetime, contactId }, { kind: "sync_failed", cause: "health_session_failed" });
    return r.ok ? ok(String(r.value.id ?? "")) : err(r.error);
  }
}