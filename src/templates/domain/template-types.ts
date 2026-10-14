import { TenantId } from "../../shared/domain/ids.ts";

/** TemplateStatus — ciclo de vida de Meta WABA */
export type TemplateStatus = "draft" | "pending" | "approved" | "rejected" | "paused" | "disabled";

export const STATUSES: readonly TemplateStatus[] = [
  "draft", "pending", "approved", "rejected", "paused", "disabled",
];

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
  readonly metaTemplateId: string | null;
  readonly rejectionReason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type WhatsAppButton =
  | { readonly type: "url"; readonly text: string; readonly url: string }
  | { readonly type: "phone_number"; readonly text: string; readonly phoneNumber: string }
  | { readonly type: "quick_reply"; readonly text: string };

export interface CannedResponseState {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly shortcode: string;
  readonly content: string;
  readonly category: string;
}

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