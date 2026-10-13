import { Result, err, ok } from "../../shared/domain/result.ts";
import { ContactId, TenantId } from "../../shared/domain/ids.ts";
import { HEALTHGateway, HOMEGateway, FLEETGateway, IntegracionError } from "../domain/integration.gateways.ts";

export class HealthAdapter implements HEALTHGateway {
  async buscarSesiones(tenantId: TenantId, professionalId: string, dateRange: string): Promise<Result<Record<string, unknown>[], IntegracionError>> {
    try {
      const resp = await fetch(`https://api.health.raisen/v1/sessions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, professionalId, dateRange }),
      });
      if (!resp.ok) return err({ kind: "provider_unavailable" });
      const data = await resp.json() as Record<string, unknown>[];
      return ok(data ?? []);
    } catch { return err({ kind: "provider_unavailable" }); }
  }

  async agendarSesion(tenantId: TenantId, professionalId: string, datetime: string, contactId: ContactId): Promise<Result<string, IntegracionError>> {
    try {
      const resp = await fetch(`https://api.health.raisen/v1/sessions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, professionalId, datetime, contactId }),
      });
      if (!resp.ok) return err({ kind: "sync_failed", cause: "health_session_failed" });
      const data = await resp.json() as Record<string, unknown>;
      return ok(String(data.id ?? ""));
    } catch { return err({ kind: "provider_unavailable" }); }
  }
}

export class HomeAdapter implements HOMEGateway {
  async obtenerPropiedad(tenantId: TenantId, propertyId: string): Promise<Result<Record<string, unknown>, IntegracionError>> {
    try {
      const resp = await fetch(`https://api.home.raisen/v1/properties/${propertyId}`, {
        headers: { "X-Tenant-Id": tenantId },
      });
      if (!resp.ok) return err({ kind: "provider_unavailable" });
      return ok(await resp.json() as Record<string, unknown>);
    } catch { return err({ kind: "provider_unavailable" }); }
  }

  async crearTicket(tenantId: TenantId, propertyId: string, description: string): Promise<Result<string, IntegracionError>> {
    try {
      const resp = await fetch(`https://api.home.raisen/v1/maintenance-tickets`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, propertyId, description }),
      });
      if (!resp.ok) return err({ kind: "sync_failed", cause: "home_ticket_failed" });
      const data = await resp.json() as Record<string, unknown>;
      return ok(String(data.id ?? ""));
    } catch { return err({ kind: "provider_unavailable" }); }
  }
}

export class FleetAdapter implements FLEETGateway {
  async obtenerEstadoEntrega(tenantId: TenantId, orderId: string): Promise<Result<Record<string, unknown>, IntegracionError>> {
    try {
      const resp = await fetch(`https://api.fleet.raisen/v1/deliveries/${orderId}`, {
        headers: { "X-Tenant-Id": tenantId },
      });
      if (!resp.ok) return err({ kind: "provider_unavailable" });
      return ok(await resp.json() as Record<string, unknown>);
    } catch { return err({ kind: "provider_unavailable" }); }
  }

  async notificarDemora(tenantId: TenantId, orderId: string, newEta: string): Promise<Result<void, IntegracionError>> {
    try {
      const resp = await fetch(`https://api.fleet.raisen/v1/delays`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, orderId, newEta }),
      });
      if (!resp.ok) return err({ kind: "sync_failed", cause: "fleet_delay_failed" });
      return ok(undefined);
    } catch { return err({ kind: "provider_unavailable" }); }
  }
}