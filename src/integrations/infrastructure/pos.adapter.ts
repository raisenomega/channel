import { Result, err, ok } from "../../shared/domain/result.ts";
import { ContactId, TenantId } from "../../shared/domain/ids.ts";
import { POSGateway, IntegracionError } from "../domain/integration.gateways.ts";

export class POSAdapter implements POSGateway {
  async enviarRecibo(tenantId: TenantId, orderId: string, channel: string): Promise<Result<void, IntegracionError>> {
    try {
      const resp = await fetch(`https://api.pos.raisen/v1/receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, orderId, channel }),
      });
      if (!resp.ok) return err({ kind: "sync_failed", cause: "pos_receipt_failed" });
      return ok(undefined);
    } catch {
      return err({ kind: "provider_unavailable" });
    }
  }

  async obtenerHistorial(tenantId: TenantId, contactId: ContactId): Promise<Result<Record<string, unknown>[], IntegracionError>> {
    try {
      const resp = await fetch(`https://api.pos.raisen/v1/history/${tenantId}/${contactId}`);
      if (!resp.ok) return err({ kind: "provider_unavailable" });
      const data = await resp.json() as Record<string, unknown>[];
      return ok(data ?? []);
    } catch {
      return err({ kind: "provider_unavailable" });
    }
  }
}