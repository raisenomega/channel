/**
 * HUB by Raisen — Puerto DDD hexagonal para adapter de WhatsApp Cloud API.
 * Define el contrato que infrastructure/ debe implementar.
 * C4 ≤50 lineas.
 */
import type { Result } from "../../../shared/domain/result.ts";
import type { WhatsAppContent } from "./message-content.vo.ts";

export interface SentMessage {
  readonly wamid: string;
  readonly status: string;
}

export interface WhatsAppAdapterPort {
  enviarMensaje(
    tenantId: string,
    fromPhoneNumberId: string,
    toPhone: string,
    content: WhatsAppContent,
  ): Promise<Result<SentMessage, string>>;

  marcarLeido(tenantId: string, phoneNumberId: string, messageId: string): Promise<Result<void, string>>;
}