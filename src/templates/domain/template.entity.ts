/**
 * HUB by Raisen — Entidades del BC de plantillas (barrel).
 * Tipos, fábricas y transición de estado en submódulos (C4 ≤75).
 */
export {
  STATUSES,
  type TemplateStatus,
  type WhatsAppTemplateState,
  type WhatsAppButton,
  type CannedResponseState,
  type TemplateError,
  type CannedError,
} from "./template-types.ts";
export { crearWhatsAppTemplate, crearCannedResponse } from "./template-factories.ts";
export { transicionarStatus } from "./template-status.ts";