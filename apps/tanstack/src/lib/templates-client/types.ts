/**
 * HUB by Raisen — Tipos del cliente de plantillas WhatsApp (Slide 4.9).
 */
export type TemplateStatus =
  | "pending_create" | "pending_meta" | "approved" | "rejected"
  | "paused" | "disabled" | "error";

export interface WhatsAppTemplate {
  readonly id: string;
  readonly name: string;
  readonly language: string;
  readonly category: string;
  readonly status: TemplateStatus;
  readonly body: string;
  readonly header_type: string | null;
  readonly header_content: string | null;
  readonly footer: string | null;
  readonly zernio_template_id: string | null;
  readonly rejection_reason: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export type TemplateError =
  | { readonly kind: "no_autorizado" }
  | { readonly kind: "red"; readonly cause?: string }
  | { readonly kind: "config_incompleta" }
  | { readonly kind: "validation"; readonly cause?: string };

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };