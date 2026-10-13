import { Result, err, ok } from "../../shared/domain/result.ts";
import { ContactId, TenantId } from "../../shared/domain/ids.ts";
import { TABLEGateway, IntegracionError } from "../domain/integration.gateways.ts";

export class TableAdapter implements TABLEGateway {
  async verificarDisponibilidad(tenantId: TenantId, datetime: string, partySize: number): Promise<Result<boolean, IntegracionError>> {
    try {
      const resp = await fetch(`https://api.table.raisen/v1/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, datetime, partySize }),
      });
      if (!resp.ok) return err({ kind: "provider_unavailable" });
      const data = await resp.json() as Record<string, unknown>;
      return ok(data.available as boolean);
    } catch {
      return err({ kind: "provider_unavailable" });
    }
  }

  async crearReserva(tenantId: TenantId, datetime: string, partySize: number, contactId: ContactId): Promise<Result<string, IntegracionError>> {
    try {
      const resp = await fetch(`https://api.table.raisen/v1/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, datetime, partySize, contactId }),
      });
      if (!resp.ok) return err({ kind: "sync_failed", cause: "table_reservation_failed" });
      const data = await resp.json() as Record<string, unknown>;
      return ok(String(data.id ?? ""));
    } catch {
      return err({ kind: "provider_unavailable" });
    }
  }
}