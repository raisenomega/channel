import { expect, test, vi } from "vitest";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { CreateTemplateHandler } from "../../../src/templates/application/create-template.handler.ts";
import { CreateTemplateWithZernioHandler } from "../../../src/templates/application/create-template-with-zernio.handler.ts";

vi.mock("../../../src/templates/infrastructure/zernio-templates.client.ts", () => ({ crearTemplateZernio: vi.fn() }));

import { crearTemplateZernio } from "../../../src/templates/infrastructure/zernio-templates.client.ts";

const BASE = { tenantId: "t1" as never, name: "hola_mundo", language: "en", category: "marketing" as never, body: "Hola {1}" };

function repoSpy() {
  return {
    guardar: vi.fn(async () => ok(undefined)),
    actualizarStatus: vi.fn(async () => ok(undefined)),
    buscar: vi.fn(async () => ok({ id: "t1", status: "pending" })),
  } as never;
}

function build() {
  const repo = repoSpy();
  const inner = new CreateTemplateHandler(repo);
  return { h: new CreateTemplateWithZernioHandler(inner, repo, () => "key", async () => "acc1") };
}

test("A-01 invalid_template_name si name no es ^[a-z_]{1,512}$", async () => {
  const { h } = build();
  const r = await h.ejecutar({ ...BASE, name: "Hola Mundo!" });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("invalid_template_name");
});

test("A-03 invalid_template_name si body supera 1024 chars", async () => {
  const { h } = build();
  const r = await h.ejecutar({ ...BASE, body: "x".repeat(1025) });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("invalid_template_name");
});

test("A-04 invalid_template_name si category no es valida", async () => {
  const { h } = build();
  const r = await h.ejecutar({ ...BASE, category: "spam" as never });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("invalid_template_name");
});

test("zernio ok -> pending_meta", async () => {
  (crearTemplateZernio as ReturnType<typeof vi.fn>).mockResolvedValue(ok({ templateId: "z-1" }));
  const { h } = build();
  const r = await h.ejecutar(BASE);
  expect(r.ok).toBe(true);
  if (r.ok) { expect(r.value.status).toBe("pending_meta"); expect(r.value.zernioTemplateId).toBe("z-1"); }
});

test("zernio http_failure -> zernio_error", async () => {
  (crearTemplateZernio as ReturnType<typeof vi.fn>).mockResolvedValue(err({ kind: "http_failure", status: 429 }));
  const { h } = build();
  const r = await h.ejecutar(BASE);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.kind).toBe("zernio_error");
});

test("sin WhatsApp conectado (accountId null) -> zernio_error whatsapp_no_conectado", async () => {
  const repo = repoSpy();
  const inner = new CreateTemplateHandler(repo);
  const h = new CreateTemplateWithZernioHandler(inner, repo, () => "key", async () => null);
  const r = await h.ejecutar(BASE);
  expect(r.ok).toBe(false);
  if (!r.ok && r.error.kind === "zernio_error") expect(r.error.cause).toBe("whatsapp_no_conectado");
});