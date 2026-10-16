/**
 * HUB by Raisen — Cliente de plantillas WhatsApp contra backend HUB (Slide 4.9).
 * C4 <=75. listarTemplates + crearTemplate. Sin throw. Sin any.
 */
import { apiFetch, resolveTenantId } from "../api-client";
import type { WhatsAppTemplate, TemplateError, Result, TemplateStatus } from "./types";

interface ListaResponse {
  ok: boolean; templates?: Array<Record<string, unknown>>; syncFailed?: boolean;
}
interface CreaResponse {
  ok: boolean; template?: { id: string; status: string }; error?: { kind: string; cause?: string };
}

export async function listarTemplates(): Promise<Result<{ templates: WhatsAppTemplate[]; syncFailed: boolean }, TemplateError>> {
  const tenantId = resolveTenantId();
  if (!tenantId) return { ok: false, error: { kind: "config_incompleta" } };
  try {
    const res = await apiFetch(`/tenants/${tenantId}/templates`);
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    const body = await res.json() as ListaResponse;
    if (!body.ok || !Array.isArray(body.templates)) return { ok: false, error: { kind: "red", cause: "schema_invalido" } };
    const templates: WhatsAppTemplate[] = body.templates.map((r) => ({
      id: String(r.id), name: String(r.name ?? ""), language: String(r.language ?? ""),
      category: String(r.category ?? ""), status: String(r.status ?? "error") as TemplateStatus,
      body: String(r.body ?? ""), header_type: r.header_type ? String(r.header_type) : null,
      header_content: r.header_content ? String(r.header_content) : null,
      footer: r.footer ? String(r.footer) : null,
      zernio_template_id: r.zernio_template_id ? String(r.zernio_template_id) : null,
      rejection_reason: r.rejection_reason ? String(r.rejection_reason) : null,
      created_at: String(r.created_at ?? ""), updated_at: String(r.updated_at ?? ""),
    }));
    return { ok: true, value: { templates, syncFailed: body.syncFailed === true } };
  } catch (e) {
    if (String(e) === "Error: no_session") return { ok: false, error: { kind: "no_autorizado" } };
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}

export async function crearTemplate(input: {
  name: string; language: string; category: string; body: string;
}): Promise<Result<{ id: string; status: string } | null, TemplateError>> {
  const tenantId = resolveTenantId();
  if (!tenantId) return { ok: false, error: { kind: "config_incompleta" } };
  try {
    const res = await apiFetch(`/tenants/${tenantId}/templates`, {
      method: "POST", body: JSON.stringify(input),
    });
    if (res.status === 400) {
      const errBody = await res.json() as { error?: { kind?: string; cause?: string } };
      return { ok: false, error: { kind: "validation", cause: errBody?.error?.cause ?? "body_invalido" } };
    }
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    const body = await res.json() as CreaResponse;
    if (!body.ok || !body.template) return { ok: false, error: { kind: "red", cause: "respuesta_invalida" } };
    return { ok: true, value: { id: body.template.id, status: body.template.status } };
  } catch (e) {
    if (String(e) === "Error: no_session") return { ok: false, error: { kind: "no_autorizado" } };
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}