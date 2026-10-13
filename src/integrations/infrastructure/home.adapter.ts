import { Result, ok, err } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { HOMEGateway, IntegracionError } from "../domain/integration.gateways.ts";
import { postJson, getJson } from "./vertical-http.ts";

export class HomeAdapter implements HOMEGateway {
  async obtenerPropiedad(tenantId: TenantId, propertyId: string): Promise<Result<Record<string, unknown>, IntegracionError>> {
    return getJson<Record<string, unknown>>(`https://api.home.raisen/v1/properties/${propertyId}`, tenantId);
  }

  async crearTicket(tenantId: TenantId, propertyId: string, description: string): Promise<Result<string, IntegracionError>> {
    const r = await postJson<Record<string, unknown>>("https://api.home.raisen/v1/maintenance-tickets", { tenantId, propertyId, description }, { kind: "sync_failed", cause: "home_ticket_failed" });
    return r.ok ? ok(String(r.value.id ?? "")) : err(r.error);
  }
}