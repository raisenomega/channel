/**
 * HUB by Raisen — SendMessageHandler: envia mensaje WhatsApp via Cloud API.
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";
import type { WhatsAppAdapterPort, SentMessage } from "../domain/whatsapp-adapter.port.ts";
import type { WhatsAppContent, WhatsAppContentType } from "../domain/message-content.vo.ts";
import type { MessagePersistenceRepo } from "./message-persistence.repo.ts";
import type { WhatsAppMessage, MessageDirection, MessageStatus } from "../domain/message.entity.ts";

export interface SendMessageCommand {
  readonly tenantId: string;
  readonly phoneNumberId: string;
  readonly toPhone: string;
  readonly content: WhatsAppContent;
}

export type SendMessageError =
  | { readonly kind: "sin_phone_number_id" }
  | { readonly kind: "telefono_invalido" }
  | { readonly kind: "envio_fallo"; readonly cause: string }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export class SendMessageHandler {
  constructor(
    private readonly adapter: WhatsAppAdapterPort,
    private readonly repo: MessagePersistenceRepo,
  ) {}

  async ejecutar(cmd: SendMessageCommand): Promise<Result<SentMessage, SendMessageError>> {
    if (!cmd.phoneNumberId || !cmd.phoneNumberId.trim()) return err({ kind: "sin_phone_number_id" });
    if (!cmd.toPhone || cmd.toPhone.trim().length < 7) return err({ kind: "telefono_invalido" });

    const envio = await this.adapter.enviarMensaje(cmd.tenantId, cmd.phoneNumberId, cmd.toPhone, cmd.content);
    if (!envio.ok) return err({ kind: "envio_fallo", cause: envio.error });

    const msg: WhatsAppMessage = {
      id: crypto.randomUUID(),
      tenantId: cmd.tenantId,
      wamid: envio.value.wamid,
      phoneNumberId: cmd.phoneNumberId,
      direction: "outbound" as MessageDirection,
      fromPhone: cmd.phoneNumberId,
      toPhone: cmd.toPhone,
      contentType: cmd.content.type as WhatsAppContentType,
      contentBody: cmd.content,
      status: "sent" as MessageStatus,
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const persist = await this.repo.guardar(msg);
    if (!persist.ok) return err({ kind: "persistence_failure", cause: persist.error });

    return ok({ wamid: envio.value.wamid, status: "sent" });
  }
}