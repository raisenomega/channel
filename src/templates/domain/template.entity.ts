import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";

/* ──────────────────────────────────────────
   TemplateStatus — ciclo de vida de Meta WABA
   ────────────────────────────────────────── */
export type TemplateStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "paused"
  | "disabled";

const STATUSES: readonly TemplateStatus[] = [
  "draft", "pending", "approved", "rejected", "paused", "disabled",
];

/* ──────────────────────────────────────────
   WhatsAppTemplate — plantilla aprobada por Meta
   ────────────────────────────────────────── */
export interface WhatsAppTemplateState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly language: string;
  readonly category: "marketing" | "utility" | "authentication";
  readonly header: Readonly<{
    type: "text" | "image" | "video" | "document" | "location" | "none";
    content: string | null;
  }>;
  readonly body: string;
  readonly footer: string | null;
  readonly buttons: readonly WhatsAppButton[];
  readonly status: TemplateStatus;
  readonly metaTemplateId: string | null;   // id devuelto por Meta
  readonly rejectionReason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type WhatsAppButton =
  | { readonly type: "url"; readonly text: string; readonly url: string }
  | { readonly type: "phone_number"; readonly text: string; readonly phoneNumber: string }
  | { readonly type: "quick_reply"; readonly text: string };

/* ──────────────────────────────────────────
   CannedResponse — respuesta rápida (misma tabla)
   ────────────────────────────────────────── */
export interface CannedResponseState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly shortcode: string;
  readonly content: string;
  readonly category: string;
}

/* ──────────────────────────────────────────
   Errores del BC
   ────────────────────────────────────────── */
export type TemplateError =
  | { readonly kind: "nombre_vacio" }
  | { readonly kind: "cuerpo_vacio" }
  | { readonly kind: "categoria_invalida" }
  | { readonly kind: "lenguaje_no_soportado" }
  | { readonly kind: "status_invalido" }
  | { readonly kind: "transicion_invalida"; readonly from: TemplateStatus; readonly to: TemplateStatus };

export type CannedError =
  | { readonly kind: "shortcode_vacio" }
  | { readonly kind: "contenido_vacio" };

/* ──────────────────────────────────────────
   Fábrica: crear WhatsAppTemplate
   ────────────────────────────────────────── */
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

/* ──────────────────────────────────────────
   Fábrica: crear CannedResponse
   ────────────────────────────────────────── */
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

/* ──────────────────────────────────────────
   Transición de estado (máquina de estados)
   ────────────────────────────────────────── */
type TransitionMap = Partial<Record<TemplateStatus, readonly TemplateStatus[]>>;

const TRANSITIONS: TransitionMap = {
  draft:       ["pending"],
  pending:     ["approved", "rejected"],
  approved:    ["paused", "disabled"],
  rejected:    ["draft", "disabled"],
  paused:      ["approved", "disabled"],
  disabled:    [],
};

export const transicionarStatus = (
  current: TemplateStatus,
  target: TemplateStatus,
): Result<TemplateStatus, TemplateError> => {
  const allowed = TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    return err({ kind: "transicion_invalida", from: current, to: target });
  }
  return ok(target);
};