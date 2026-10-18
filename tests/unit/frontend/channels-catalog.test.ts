/**
 * HUB by Raisen — O-1 adversarial A-O-1: el catalogo expone las 9 redes y listarCanales
 * mapea un 200 del backend a Channel[] (cards), sin error "no se pudieron cargar".
 */
import { expect, test, vi, beforeEach } from "vitest";
import { CATALOGO } from "@/routes/channels-ui/channels-data";

vi.mock("@/lib/api-client", () => ({ apiFetch: vi.fn() }));
vi.mock("@/lib/tenant-client/mi-tenant", () => ({ ensureTenantId: vi.fn(async () => "t-1"), errorSinTenant: () => ({ kind: "config_incompleta" }) }));
import { apiFetch } from "@/lib/api-client";
import { listarCanales } from "@/lib/channels-client/functions";

beforeEach(() => vi.clearAllMocks());

test("A-O-1 CATALOGO expone 9 redes", () => {
  expect(CATALOGO.length).toBe(9);
});

test("A-O-1 listarCanales mapea 200 -> Channel[] (sin error)", async () => {
  (apiFetch as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
    ok: true, status: 200,
    json: async () => ({ ok: true, channels: [{ id: "c1", platform: "whatsapp", isPaused: false, status: "connected" }] }),
  });
  const r = await listarCanales();
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.length).toBe(1); expect(r.value[0]?.state).toBe("conectado"); }
});
