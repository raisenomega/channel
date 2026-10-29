import { expect, test, vi } from "vitest";
import { ok, err } from "../../../src/shared/domain/result.ts";
import { ImportTemplateLibraryHandler } from "../../../src/templates/application/import-template-library.handler.ts";

vi.mock("../../../src/templates/infrastructure/zernio-templates.client.ts", () => ({ importarLibraryZernio: vi.fn() }));

import { importarLibraryZernio } from "../../../src/templates/infrastructure/zernio-templates.client.ts";

function build() {
  const guardado: unknown[] = [];
  const repo = { guardar: vi.fn(async (t: unknown) => { guardado.push(t); return ok(undefined); }) } as never;
  return { h: new ImportTemplateLibraryHandler(repo, () => "key", async () => "acc1"), guardado };
}

test("ok path -> template creado como approved", async () => {
  (importarLibraryZernio as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));
  const { h, guardado } = build();
  const res = await h.ejecutar({ tenantId: "t1" as never, libraryTemplateName: "welcome", language: "en", body: undefined });
  expect(res.ok).toBe(true);
  if (res.ok) { expect(res.value.status).toBe("approved"); expect(res.value.name).toBe("welcome"); }
  expect(guardado.length).toBe(1);
});

test("A-10 404 de Zernio -> library_template_not_found", async () => {
  (importarLibraryZernio as ReturnType<typeof vi.fn>).mockResolvedValue(err({ kind: "http_failure", status: 404 }));
  const { h } = build();
  const res = await h.ejecutar({ tenantId: "t1" as never, libraryTemplateName: "unknown", language: "en", body: undefined });
  expect(res.ok).toBe(false);
  if (!res.ok) expect(res.error.kind).toBe("library_template_not_found");
});

test("credencial_ausente -> zernio_error", async () => {
  (importarLibraryZernio as ReturnType<typeof vi.fn>).mockResolvedValue(err({ kind: "credencial_ausente" }));
  const { h } = build();
  const res = await h.ejecutar({ tenantId: "t1" as never, libraryTemplateName: "welcome", language: "en", body: undefined });
  expect(res.ok).toBe(false);
  if (!res.ok) expect(res.error.kind).toBe("zernio_error");
});