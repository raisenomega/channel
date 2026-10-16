/**
 * HUB by Raisen — Cliente de plantillas WhatsApp: importar/actualizar (Slide 4.9).
 * C4 <=75. Funciones separadas por limite de lineas. Sin throw. Sin any.
 */
import { apiFetch, resolveTenantId } from "../api-client";
import type { TemplateError, Result } from "./types";

interface SimpleResponse { ok: boolean; error?: { kind: string; cause?: string } }

export async function importarLibrary(nombre: string, language: string): Promise<Result<void, TemplateError>> {
  const tenantId = resolveTenantId();
  if (!tenantId) return { ok: false, error: { kind: "config_incompleta" } };
  try {
    const res = await apiFetch(`/tenants/${tenantId}/templates/${encodeURIComponent(nombre)}/import-library`, {
      method: "POST", body: JSON.stringify({ libraryTemplateName: nombre, language }),
    });
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (res.status === 404) return { ok: false, error: { kind: "validation", cause: "library_template_not_found" } };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    return { ok: true, value: undefined };
  } catch (e) {
    if (String(e) === "Error: no_session") return { ok: false, error: { kind: "no_autorizado" } };
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}

export async function actualizarTemplate(
  templateName: string, edits: { body?: string; category?: string; footer?: string },
): Promise<Result<void, TemplateError>> {
  const tenantId = resolveTenantId();
  if (!tenantId) return { ok: false, error: { kind: "config_incompleta" } };
  try {
    const res = await apiFetch(`/tenants/${tenantId}/templates/${encodeURIComponent(templateName)}`, {
      method: "PATCH", body: JSON.stringify(edits),
    });
    if (res.status === 401 || res.status === 403) return { ok: false, error: { kind: "no_autorizado" } };
    if (!res.ok) return { ok: false, error: { kind: "red", cause: `status ${res.status}` } };
    const body = await res.json() as SimpleResponse;
    return body.ok ? { ok: true, value: undefined } : { ok: false, error: { kind: "red", cause: "respuesta_invalida" } };
  } catch (e) {
    if (String(e) === "Error: no_session") return { ok: false, error: { kind: "no_autorizado" } };
    return { ok: false, error: { kind: "red", cause: String(e) } };
  }
}