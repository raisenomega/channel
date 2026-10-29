/**
 * HUB by Raisen — Rutas de plantillas WhatsApp (Slide 4.9). Con requireTenantAuth (Compuerta #17).
 * POST /tenants/:id/templates · GET /tenants/:id/templates · PATCH /:id/templates/:name · POST /:id/templates/:name/import-library. C4 ≤75.
 */
import type { RouteDefinition, RequestContext } from "../../server/server-types.ts";
import { requireTenantAuth, jsonResponse } from "../../server/auth-helpers.ts";
import type { CreateTemplateWithZernioHandler } from "../application/create-template-with-zernio.handler.ts";
import type { ListTemplatesQuery } from "../application/list-templates.query.ts";
import type { PatchTemplateHandler } from "../application/patch-template.handler.ts";
import type { ImportTemplateLibraryHandler } from "../application/import-template-library.handler.ts";
import type { SyncTemplateStatusHandler } from "../application/sync-template-status.handler.ts";
import type { WhatsAppTemplateRepository } from "../domain/template.repository.ts";
import type { ZernioTplStatus } from "../infrastructure/zernio-status.client.ts";

export interface TemplatesDeps {
  readonly create: CreateTemplateWithZernioHandler;
  readonly list: ListTemplatesQuery;
  readonly patch: PatchTemplateHandler;
  readonly import: ImportTemplateLibraryHandler;
  readonly syncStatus: SyncTemplateStatusHandler;
  readonly estadoLive: (tenantId: string) => Promise<readonly ZernioTplStatus[]>;
  readonly webhookSecret: string;
  readonly repo: WhatsAppTemplateRepository;
}

const tid = (p: string): string => p.split("/")[2] ?? "";
const body = (ctx: RequestContext): Record<string, unknown> => (typeof ctx.body === "object" && ctx.body ? ctx.body as Record<string, unknown> : {});

export function rutaCrearTemplate(d: TemplatesDeps): RouteDefinition {
  return { method: "POST", path: "/tenants/:id/templates", handler: async (ctx) => {
    const auth = await requireTenantAuth(ctx, tid(ctx.path)); if (!auth.ok) return auth.error;
    const b = body(ctx);
    const r = await d.create.ejecutar({ tenantId: auth.value.tenantId as never, name: String(b.name ?? ""), language: String(b.language ?? ""), category: String(b.category ?? "") as never, body: String(b.body ?? "") });
    if (!r.ok) { const k = r.error.kind; const st = k === "zernio_error" || k === "persistence_failure" ? 502 : 400; return jsonResponse(st, { ok: false, error: { kind: k } }); }
    return jsonResponse(201, { ok: true, template: r.value });
  } };
}
export function rutaListarTemplates(d: TemplatesDeps): RouteDefinition {
  return { method: "GET", path: "/tenants/:id/templates", handler: async (ctx) => {
    const auth = await requireTenantAuth(ctx, tid(ctx.path)); if (!auth.ok) return auth.error;
    const r = await d.list.ejecutar(auth.value.tenantId as never);
    if (!r.ok) return jsonResponse(502, { ok: false, error: { kind: r.error.kind } });
    return { ok: true, templates: r.value.templates, syncFailed: r.value.syncFailed };
  } };
}
export function rutaPatchTemplate(d: TemplatesDeps): RouteDefinition {
  return { method: "PATCH", path: "/tenants/:id/templates/:templateName", handler: async (ctx) => {
    const auth = await requireTenantAuth(ctx, tid(ctx.path)); if (!auth.ok) return auth.error;
    const b = body(ctx);
    const r = await d.patch.ejecutar({ tenantId: auth.value.tenantId as never, templateName: ctx.params["templateName"] ?? "", edits: { body: b.body as string | undefined, category: b.category as never, footer: b.footer as string | undefined, header: b.header as never } });
    if (!r.ok) { const k = r.error.kind; const st = k === "not_found" ? 404 : k === "template_not_editable" ? 409 : 502; return jsonResponse(st, { ok: false, error: { kind: k } }); }
    return jsonResponse(200, { ok: true, template: r.value });
  } };
}
export function rutaEstadoTemplates(d: TemplatesDeps): RouteDefinition {
  return { method: "GET", path: "/tenants/:id/templates/status", handler: async (ctx) => {
    const auth = await requireTenantAuth(ctx, tid(ctx.path)); if (!auth.ok) return auth.error;
    const statuses = await d.estadoLive(String(auth.value.tenantId));
    return jsonResponse(200, { ok: true, statuses });
  } };
}

export function rutaImportLibrary(d: TemplatesDeps): RouteDefinition {
  return { method: "POST", path: "/tenants/:id/templates/:templateName/import-library", handler: async (ctx) => {
    const auth = await requireTenantAuth(ctx, tid(ctx.path)); if (!auth.ok) return auth.error;
    const b = body(ctx);
    const r = await d.import.ejecutar({ tenantId: auth.value.tenantId as never, libraryTemplateName: ctx.params["templateName"] ?? "", category: b.category as string | undefined, language: String(b.language ?? "en"), body: b.body as string | undefined });
    if (!r.ok) { const k = r.error.kind; const st = k === "library_template_not_found" ? 404 : k === "zernio_error" ? 502 : 400; return jsonResponse(st, { ok: false, error: { kind: k } }); }
    return jsonResponse(201, { ok: true, template: r.value });
  } };
}