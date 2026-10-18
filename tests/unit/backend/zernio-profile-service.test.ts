/**
 * HUB by Raisen — O-6: ZernioProfileService.ensureProfileForTenant idempotencia.
 * Caso idempotente (tenant ya tiene profile) NO llama a Zernio. Caso tenant ausente -> error.
 */
import { expect, test, vi } from "vitest";
import { ZernioProfileService } from "../../../src/channels/application/zernio-profile.service.ts";

test("O-6 idempotente: tenant con zernioProfileId -> lo devuelve sin tocar Zernio ni persistir", async () => {
  const update = vi.fn();
  const store = {
    buscar: async () => ({ ok: true as const, value: { zernioProfileId: "prof-existente", slug: "zafacones" } }),
    actualizarZernioProfileId: update,
  } as never;
  const svc = new ZernioProfileService(store, "api-key");
  const r = await svc.ensureProfileForTenant("t-1" as never);
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.value.zernioProfileId).toBe("prof-existente");
  expect(update).not.toHaveBeenCalled();
});

test("O-6 tenant inexistente -> tenant_not_found", async () => {
  const store = { buscar: async () => ({ ok: true as const, value: null }), actualizarZernioProfileId: async () => ({ ok: true as const, value: undefined }) } as never;
  const r = await new ZernioProfileService(store, "k").ensureProfileForTenant("t-x" as never);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("tenant_not_found");
});
