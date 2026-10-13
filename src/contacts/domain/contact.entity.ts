import { Result, err, ok } from "../../shared/domain/result.ts";
import { ContactId, TenantId, UserId } from "../../shared/domain/ids.ts";
import { Language, ChannelType } from "../../shared/domain/types.ts";
import { Email } from "../../shared/domain/email.vo.ts";
import { Phone } from "../../shared/domain/phone.vo.ts";

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

const SEGMENTS: readonly ContactSegment[] = [
  "new_lead", "prospect", "customer", "recurring", "vip", "at_risk", "churned", "blocked",
];

export const crearContacto = (
  tenantId: TenantId,
  displayName: string,
  email?: string,
  phone?: string,
  segment: ContactSegment = "new_lead",
  language: Language = "es",
): Result<ContactState, ContactError> => {
  if (!displayName || displayName.trim().length === 0) {
    return err({ kind: "nombre_vacio" });
  }
  if (!SEGMENTS.includes(segment)) {
    return err({ kind: "segmento_invalido" });
  }
  const emailVO = email ? Email.crear(email) : null;
  if (email && !emailVO?.ok) return err({ kind: "email_invalido" });
  const phoneVO = phone ? Phone.crear(phone) : null;
  if (phone && !phoneVO?.ok) return err({ kind: "telefono_invalido" });

  return ok(Object.freeze({
    id: crypto.randomUUID() as ContactId,
    tenantId,
    displayName: displayName.trim(),
    primaryEmail: emailVO?.ok ? emailVO.value : null,
    primaryPhone: phoneVO?.ok ? phoneVO.value : null,
    language,
    segment,
    ltvUsd: 0,
    totalOrders: 0,
    preferredChannel: null,
    doNotContact: false,
    marketingOptIn: false,
    aiContextSummary: null,
    createdAt: new Date(),
  }));
};