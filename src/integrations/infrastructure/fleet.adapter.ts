import { Result, ok, err } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { FLEETGateway, IntegracionError } from "../domain/integration.gateways.ts";
import { postJson, getJson } from "./vertical-http.ts";

export class FleetAdapter implements FLEETGateway {
  async obtenerEstadoEntrega(tenantId: TenantId, orderId: string): Promise<Result<Record<string, unknown>, IntegracionError>> {
    return getJson<Record<string, unknown>>(`https://api.fleet.raisen/v1/deliveries/${orderId}`, tenantId);
  }

  async notificarDemora(tenantId: TenantId, orderId: string, newEta: string): Promise<Result<void, IntegracionError>> {
    const r = await postJson<Record<string, unknown>>("https://api.fleet.raisen/v1/delays", { tenantId, orderId, newEta }, { kind: "sync_failed", cause: "fleet_delay_failed" });
    return r.ok ? ok(undefined) : err(r.error);
  }
}