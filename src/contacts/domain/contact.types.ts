/**
 * HUB by Raisen — Contact: tipos puras (segmento, origen, errores).
 * Extraidos para cumplir la regla C4 (<=75 lineas por archivo).
 */
import type { ContactId, TenantId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import type { Language } from "../../shared/domain/locale.vo.ts";
import type { Email } from "../../shared/domain/email.vo.ts";
import type { Phone } from "../../shared/domain/phone.vo.ts";

export type ContactSegment =
  | "new_lead" | "prospect" | "customer" | "recurring" | "vip" | "at_risk" | "churned" | "blocked";

export type CreatedBySource =
  | "inbound_message" | "manual" | "import_csv" | "nucleo_sync" | "webchat_form" | "campaign_response" | "api";

export interface ContactState {
  readonly id: ContactId;
  readonly tenantId: TenantId;
  readonly displayName: string;
  readonly primaryEmail: Email | null;
  readonly primaryPhone: Phone | null;
  readonly language: Language;
  readonly segment: ContactSegment;
  readonly ltvUsd: number;
  readonly totalOrders: number;
  readonly preferredChannel: ChannelType | null;
  readonly doNotContact: boolean;
  readonly marketingOptIn: boolean;
  readonly aiContextSummary: string | null;
  readonly createdAt: Date;
}

export type ContactError =
  | { readonly kind: "nombre_vacio" }
  | { readonly kind: "segmento_invalido" }
  | { readonly kind: "email_invalido" }
  | { readonly kind: "telefono_invalido" };

export const SEGMENTS: readonly ContactSegment[] = [
  "new_lead", "prospect", "customer", "recurring", "vip", "at_risk", "churned", "blocked",
];