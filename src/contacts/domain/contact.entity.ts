import { Result, err, ok } from "../../shared/domain/result.ts";
import { ContactId, TenantId } from "../../shared/domain/ids.ts";
import { Language } from "../../shared/domain/locale.vo.ts";
import { Email } from "../../shared/domain/email.vo.ts";
import { Phone } from "../../shared/domain/phone.vo.ts";
import { ContactError, ContactSegment, ContactState, SEGMENTS } from "./contact.types.ts";

export type { ContactError, ContactSegment, ContactState, CreatedBySource } from "./contact.types.ts";

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