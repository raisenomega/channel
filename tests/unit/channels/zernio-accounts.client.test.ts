/**
 * HUB by Raisen — Hotfix G (D4): cliente Zernio /v1/accounts + filtro R20 por enlaces del tenant.
 */
import { expect, test, vi } from "vitest";
import { filtrarPorTenant, listarCuentasZernio, normalizarCuenta } from "../../../src/channels/infrastructure/zernio-accounts.client.ts";
import type { ZernioAccount } from "../../../src/channels/infrastructure/zernio-accounts.client.ts";
import type { ChannelConnection } from "../../../src/channels/domain/social-account.entity.ts";

const enlace = (zernioAccountId: string | null, status: ChannelConnection["status"] = "connected"): ChannelConnection => ({
  id: "c", tenantId: "t1", platform: "instagram", zernioAccountId, handle: null, followersCount: null, status,
  isPrimary: true, isPaused: false, autoPublishAllowed: false, createdAt: "", updatedAt: "",
});
const cuenta = (id: string, platform = "instagram"): ZernioAccount => ({ zernioAccountId: id, platform, handle: null, followersCount: null, status: "connected" });

test("G-08 filtrarPorTenant: Zernio devuelve 3 cuentas, el tenant tiene 1 enlazada -> solo esa (R20)", () => {
  const r = filtrarPorTenant([cuenta("a"), cuenta("b", "facebook"), cuenta("c")], [enlace("b")]);
  expect(r.map((x) => x.zernioAccountId)).toEqual(["b"]);
  expect(Object.isFrozen(r)).toBe(true);
});

test("toggle: enlace DISCONNECTED -> excluido (HUB no usa el canal desconectado) aunque Zernio lo tenga", () => {
  expect(filtrarPorTenant([cuenta("b")], [enlace("b", "disconnected")])).toEqual([]);
  expect(filtrarPorTenant([cuenta("b")], [enlace("b", "awaiting")])).toEqual([]); // solo 'connected' cuenta como usable
  expect(filtrarPorTenant([cuenta("b")], [enlace("b", "connected")]).map((x) => x.zernioAccountId)).toEqual(["b"]);
});

test("G-09 filtrarPorTenant: sin enlaces (o enlaces con id null) -> [] aunque Zernio tenga cuentas", () => {
  expect(filtrarPorTenant([cuenta("a"), cuenta("b")], [])).toEqual([]);
  expect(filtrarPorTenant([cuenta("a")], [enlace(null)])).toEqual([]);
});

test("normalizarCuenta acepta el shape REAL de Zernio (_id/username/isActive) y el legacy (zernio_account_id/handle/status)", () => {
  expect(normalizarCuenta({ _id: "x1", platform: "instagram", username: "@a", followers_count: 5, isActive: true }))
    .toEqual({ zernioAccountId: "x1", platform: "instagram", handle: "@a", followersCount: 5, status: "connected" });
  expect(normalizarCuenta({ zernio_account_id: "x2", platform: "facebook", handle: "@b", status: "awaiting" }))
    .toEqual({ zernioAccountId: "x2", platform: "facebook", handle: "@b", followersCount: null, status: "awaiting" });
  expect(normalizarCuenta({ platform: "instagram" })).toBeNull();
  expect(normalizarCuenta({ _id: "x3" })).toBeNull();
});

test("listarCuentasZernio: usa GET /v1/accounts (la ruta real), filtro ?platform= si se pide, Bearer apiKey, descarta invalidas", async () => {
  const original = globalThis.fetch;
  const fn = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ accounts: [{ _id: "ok1", platform: "instagram", isActive: true }, { platform: "sin-id" }] }), { status: 200 }));
  globalThis.fetch = fn;
  const r = await listarCuentasZernio("key-123", "instagram");
  expect(r.ok && r.value.map((c) => c.zernioAccountId)).toEqual(["ok1"]);
  expect(String(fn.mock.calls[0]?.[0])).toBe("https://api.zernio.io/v1/accounts?platform=instagram");
  expect((fn.mock.calls[0]?.[1] as { headers: Record<string, string> }).headers.Authorization).toBe("Bearer key-123");
  const sinFiltro = await listarCuentasZernio("key-123");
  expect(sinFiltro.ok).toBe(true);
  expect(String(fn.mock.calls[1]?.[0])).toBe("https://api.zernio.io/v1/accounts");
  globalThis.fetch = vi.fn().mockRejectedValue(new Error("red caida"));
  const caida = await listarCuentasZernio("key-123");
  expect(!caida.ok && caida.error).toBe("zernio_error");
  globalThis.fetch = original;
});
