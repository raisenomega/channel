/**
 * HUB by Raisen — Adapter WhatsApp Cloud API (DDD hexagonal).
 * Implementa WhatsAppAdapterPort usando WhatsAppCloudApiClient.
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";
import type { WhatsAppAdapterPort, SentMessage } from "../domain/whatsapp-adapter.port.ts";
import type { WhatsAppContent } from "../domain/message-content.vo.ts";
import { WhatsAppCloudApiClient } from "./whatsapp-cloud-api.client.ts";

export class WhatsAppCloudAdapter implements WhatsAppAdapterPort {
  private api = new WhatsAppCloudApiClient();

  async enviarMensaje(tenantId: string, fromPhoneNumberId: string, toPhone: string, content: WhatsAppContent): Promise<Result<SentMessage, string>> {
    const tokenRes = await this.buscarToken(tenantId);
    if (!tokenRes.ok) return tokenRes;
    const result = await this.api.enviar(toPhone, content, tokenRes.value, fromPhoneNumberId);
    if (!result.ok) return err(result.error);
    return ok({ wamid: result.value.wamid, status: "sent" });
  }

  async marcarLeido(phoneNumberId: string, messageId: string): Promise<Result<void, string>> {
    const tokenRes = await this.buscarToken("");
    if (!tokenRes.ok) return tokenRes;
    return this.api.marcarLeido(messageId, tokenRes.value, phoneNumberId);
  }

  private async buscarToken(_tenantId: string): Promise<Result<string, string>> {
    return err("token_no_disponible_sin_signup");
  }
}