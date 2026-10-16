/**
 * HUB by Raisen — Integration tests de templates.routes (Slide 4.9).
 */
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SignJWT } from "jose";
import { rutaCrearTemplate, rutaListarTemplates, rutaPatchTemplate, rutaImportLibrary } from "../../src/templates/presentation/templates.routes.ts";
import type { TemplatesDeps } from "../../src/templates/presentation/templates.routes.ts";
import type { HttpResponse, RequestContext } from "../../src/server/server-types.ts";
import { ok, err } from "../../src/shared/domain/result.ts";

const SECRET = "test-supabase-jwt-secret-which-is-long-enough-32char";
async function bearer(tenantId: string): Promise<string> {
  const t = await new SignJWT({ sub: "u1", tenant_id: tenantId }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(new TextEncoder().encode(SECRET));
  return `Bearer ${t}`;
}
function ctx(method: string, path: string, params: Record<string, string>, authorization?: string, body: unknown = null): RequestContext {
  return { method, path, headers: authorization ? { authorization } : {}, body, rawBody: JSON.stringify(body ?? {}), jwt: null, params: Object.freeze(params) };
}

const templates: Record<string, unknown>[] = [];

const deps = {
  create: {
    ejecutar: vi.fn(async (cmd: { name: string; body: string; category: string }) => {
      if (!/^[a-z_]{1,512}$/.test(cmd.name)) return err({ kind: "invalid_template_name" });
      if (cmd.body.length > 1024 || !cmd.body?.length) return err({ kind: "invalid_template_name" });
      if (!["marketing", "utility", "authentication"].includes(cmd.category)) return err({ kind: "invalid_template_name" });
      const id = "tpl-1";
      templates.push({ id, name: cmd.name, status: "pending_meta" });
      return ok({ id, status: "pending_meta", zernioTemplateId: null });
    }),
  },
  list: {
    ejecutar: vi.fn(async () => ok({ templates: templates.map((t) => Object.freeze(t)), syncFailed: false })),
  },
  patch: {
    ejecutar: vi.fn(async (cmd: { templateName: string }) => {
      const t = templates.find((x) => x.name === cmd.templateName);
      if (!t) return err({ kind: "not_found" });
      return err({ kind: "template_not_editable" });
    }),
  },
  import: {
    ejecutar: vi.fn(async () => err({ kind: "library_template_not_found" })),
  },
  syncStatus: {}, webhookSecret: "whsec-test", repo: {},
} as unknown as TemplatesDeps;

beforeEach(() => { vi.stubEnv("SUPABASE_JWT_SECRET", SECRET); templates.length = 0; });
afterEach(() => { vi.unstubAllEnvs(); });

test("create 201: POST /tenants/t1/templates con body valido -> 201 + template.id", async () => {
  const r = await rutaCrearTemplate(deps).handler(ctx("POST", "/tenants/t1/templates", { id: "t1" }, await bearer("t1"), { name: "hola_mundo", language: "en", category: "marketing", body: "Hola {1}" })) as { status: number; body?: string };
  if (typeof r.body === "string") {
    const j = JSON.parse(r.body);
    expect(r.status).toBe(201);
    expect(j.ok).toBe(true);
    expect(j.template.id).toBeTruthy();
    expect(j.template.status).toBe("pending_meta");
  }
});

test("list 200: GET /tenants/t1/templates -> array", async () => {
  const r = await rutaListarTemplates(deps).handler(ctx("GET", "/tenants/t1/templates", { id: "t1" }, await bearer("t1"))) as Record<string, unknown>;
  expect(r.ok).toBe(true);
  expect(Array.isArray(r.templates)).toBe(true);
});

test("patch no encontrado -> 404", async () => {
  const r = await rutaPatchTemplate(deps).handler(ctx("PATCH", "/tenants/t1/templates/inexistente", { id: "t1", templateName: "inexistente" }, await bearer("t1"), { body: "editado" })) as HttpResponse;
  expect(r.status).toBe(404);
});

test("import library not found -> 404", async () => {
  const r = await rutaImportLibrary(deps).handler(ctx("POST", "/tenants/t1/templates/unknown/import-library", { id: "t1", templateName: "unknown" }, await bearer("t1"), { language: "en" })) as HttpResponse;
  expect(r.status).toBe(404);
});

test("sin auth -> 401 en todas las rutas", async () => {
  for (const route of [rutaCrearTemplate, rutaListarTemplates, rutaPatchTemplate, rutaImportLibrary]) {
    const r = await route(deps).handler(ctx("GET", "/tenants/t1/templates", { id: "t1" })) as HttpResponse;
    expect(r.status).toBe(401);
  }
});
