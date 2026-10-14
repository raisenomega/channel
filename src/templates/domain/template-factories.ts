import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import {
  WhatsAppTemplateState, WhatsAppButton, CannedResponseState,
  TemplateError, CannedError,
} from "./template-types.ts";

export const crearWhatsAppTemplate = (
  tenantId: TenantId,
  name: string,
  language: string,
  category: "marketing" | "utility" | "authentication",
  body: string,
  header?: { type: "text" | "image" | "video" | "document" | "location" | "none"; content?: string },
  footer?: string,
  buttons?: readonly WhatsAppButton[],
): Result<WhatsAppTemplateState, TemplateError> => {
  if (!name?.trim()) return err({ kind: "nombre_vacio" });
  if (!body?.trim()) return err({ kind: "cuerpo_vacio" });
  if (!["marketing", "utility", "authentication"].includes(category)) {
    return err({ kind: "categoria_invalida" });
  }
  if (!language || language.length !== 2) return err({ kind: "lenguaje_no_soportado" });

  const now = new Date();
  return ok(Object.freeze({
    id: crypto.randomUUID(),
    tenantId,
    name: name.trim(),
    language: language.toLowerCase(),
    category,
    header: Object.freeze({
      type: header?.type ?? "none",
      content: header?.type && header.type !== "none" && header.content ? header.content.trim() : null,
    }),
    body: body.trim(),
    footer: footer?.trim() ?? null,
    buttons: Object.freeze(buttons ?? []),
    status: "draft",
    metaTemplateId: null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
  }));
};

export const crearCannedResponse = (
  tenantId: TenantId,
  shortcode: string,
  content: string,
  category = "general",
): Result<CannedResponseState, CannedError> => {
  if (!shortcode?.trim()) return err({ kind: "shortcode_vacio" });
  if (!content?.trim()) return err({ kind: "contenido_vacio" });
  return ok(Object.freeze({
    id: crypto.randomUUID(),
    tenantId,
    shortcode: shortcode.trim(),
    content: content.trim(),
    category,
  }));
};