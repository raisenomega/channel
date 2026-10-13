import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import {
  IntegracionRepository,
  IntegrationConfigState,
  IntegrationType,
} from "../domain/integration.entity.ts";
import { IntegracionError } from "../domain/integration.gateways.ts";

export interface ProviderStatus {
  readonly type: IntegrationType;
  readonly isConfigured: boolean;
  readonly isActive: boolean;
}

const TIPOS: readonly IntegrationType[] = Object.freeze([
  "nucleo", "omega", "pos", "table", "health", "home", "fleet",
]);

/** Verifica si cada proveedor esta configurado en integration_configs (N5 honesto). */
export class CheckIntegrationsHandler {
  constructor(private readonly repo: IntegracionRepository) {}

  async ejecutar(tenantId: TenantId): Promise<Result<readonly ProviderStatus[], IntegracionError>> {
    const estados: ProviderStatus[] = [];
    for (const type of TIPOS) {
      const res = await this.repo.obtenerConfig(tenantId, type);
      if (!res.ok) return err({ kind: "provider_unavailable" });
      estados.push(estadoDe(res.value, type));
    }
    return ok(Object.freeze(estados));
  }
}

function estadoDe(
  config: IntegrationConfigState | null,
  type: IntegrationType,
): ProviderStatus {
  return {
    type,
    isConfigured: config !== null,
    isActive: config?.isActive ?? false,
  };
}
