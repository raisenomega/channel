import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { OMEGAGateway, IntegracionError } from "../domain/integration.gateways.ts";

export class OmegaAdapter implements OMEGAGateway {
  private cache = new Map<string, { voice: string; expiresAt: number }>();

  async obtenerBrandVoice(tenantId: TenantId): Promise<Result<string, IntegracionError>> {
    const cached = this.cache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) return ok(cached.voice);
    try {
      const resp = await fetch(`https://api.omega.raisen/v1/brand-voice/${tenantId}`);
      if (!resp.ok) {
        if (cached) return ok(cached.voice);
        return err({ kind: "provider_unavailable" });
      }
      const data = await resp.json() as Record<string, unknown>;
      const voice = String(data.voice ?? "");
      this.cache.set(tenantId, { voice, expiresAt: Date.now() + 3_600_000 });
      return ok(voice);
    } catch {
      if (cached) return ok(cached.voice);
      return err({ kind: "provider_unavailable" });
    }
  }

  async registrarCampania(tenantId: TenantId, data: Record<string, unknown>): Promise<Result<void, IntegracionError>> {
    try {
      const resp = await fetch(`https://api.omega.raisen/v1/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, ...data }),
      });
      if (!resp.ok) return err({ kind: "sync_failed", cause: "omega_campaign_failed" });
      return ok(undefined);
    } catch {
      return err({ kind: "provider_unavailable" });
    }
  }
}