import { Result, err, ok } from "../../shared/domain/result.ts";
import { ContactId, TenantId } from "../../shared/domain/ids.ts";
import { NUCLEOGateway, IntegracionError } from "../domain/integration.gateways.ts";
import { IntegracionRepository } from "../domain/integration.entity.ts";

export class SyncFromNucleoHandler {
  constructor(
    private readonly nucleo: NUCLEOGateway,
    private readonly repo: IntegracionRepository,
  ) {}

  async ejecutar(tenantId: TenantId, nucleoCustomerId: string): Promise<Result<Record<string, unknown>, IntegracionError>> {
    const config = await this.repo.obtenerConfig(tenantId, "nucleo");
    if (!config.ok) return err({ kind: "sync_failed", cause: "nucleo_not_configured" });
    return this.nucleo.obtenerContacto(tenantId, nucleoCustomerId);
  }
}