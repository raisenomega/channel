/**
 * HUB by Raisen — ReceiveMessageHandler: procesa webhook entrante de WhatsApp.
 * Valida, persiste inbound, idempotente por wamid.
 * Tras persistir emite notificacion (best-effort).
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";
import type { WhatsAppContent, WhatsAppContentType } from "../domain/message-content.vo.ts";
import type { MessagePersistenceRepo } from "./message-persistence.repo.ts";
import type { WhatsAppMessage, MessageDirection, MessageStatus } from "../domain/message.entity.ts";

export interface InboundMessage {
  readonly wamid: string;
  readonly fromPhone: string;
  readonly toPhone: string;
  readonly phoneNumberId: string;
  readonly content: WhatsAppContent;
  readonly timestamp: string;
}

export interface NotificationEmitterPort {
  ejecutar(cmd: {
    tenantId: string; userId: string; type: string; severity?: string;
    title: string; body?: string; payload?: Record<string, unknown>;
  }): Promise<Result<unknown, unknown>>;
}

export type ReceiveMessageError =
  | { readonly kind: "payload_invalido"; readonly cause: string }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export class ReceiveMessageHandler {
  constructor(
    private readonly repo: MessagePersistenceRepo,
    private readonly notificationEmitter?: NotificationEmitterPort,
  ) {}

  async ejecutar(tenantId: string, inbound: InboundMessage): Promise<Result<{ processed: boolean }, ReceiveMessageError>> {
    if (!inbound.wamid || !inbound.fromPhone || !inbound.content) {
      return err({ kind: "payload_invalido", cause: "campos_requeridos_faltantes" });
    }
    const existente = await this.repo.buscarPorWamid(inbound.wamid);
    if (!existente.ok) return err({ kind: "persistence_failure", cause: existente.error });
    if (existente.value) return ok({ processed: false });

    const msg: WhatsAppMessage = {
      id: crypto.randomUUID(), tenantId, wamid: inbound.wamid, phoneNumberId: inbound.phoneNumberId,
      direction: "inbound" as MessageDirection, fromPhone: inbound.fromPhone, toPhone: inbound.toPhone,
      contentType: inbound.content.type as WhatsAppContentType, contentBody: inbound.content,
      status: "received" as MessageStatus, createdAt: inbound.timestamp ?? new Date().toISOString(),
    };
    const persist = await this.repo.guardar(msg);
    if (!persist.ok) return err({ kind: "persistence_failure", cause: persist.error });

    if (this.notificationEmitter) {
      const bodyText = inbound.content.type === "text" ? (inbound.content as { body: string }).body : "[media]";
      void this.notificationEmitter.ejecutar({
        tenantId, userId: "", type: "message_received", severity: "info",
        title: `Nuevo mensaje de ${inbound.fromPhone}`, body: bodyText,
        payload: { message_id: msg.id, wamid: inbound.wamid, channel: "whatsapp" },
      });
    }
    return ok({ processed: true });
  }
}