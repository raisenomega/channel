import { Result, err, ok } from "../../shared/domain/result.ts";
import { ConversationId, ContactId, TenantId, InboxId } from "../../shared/domain/ids.ts";
import { ChannelType } from "../../shared/domain/types.ts";
import { crearConversacion, ConversationState } from "../domain/conversation.entity.ts";
import { crearMensaje, MessageContent, MessageState } from "../domain/message.entity.ts";
import { ConversationRepository } from "../domain/inbox.repository.ts";

export interface ReceiveMessageCommand {
  readonly tenantId: TenantId;
  readonly inboxId: string;
  readonly channel: ChannelType;
  readonly provider: string;
  readonly from: string;
  readonly contactId: ContactId;
  readonly content: MessageContent;
}

export type ReceiveMessageError =
  | { readonly kind: "contacto_requerido" }
  | { readonly kind: "contenido_vacio" }
  | { readonly kind: "persistence_failure"; readonly cause: string };

export class ReceiveMessageHandler {
  constructor(private readonly convRepo: ConversationRepository) {}

  async ejecutar(cmd: ReceiveMessageCommand): Promise<Result<ConversationId, ReceiveMessageError>> {
    const activas = await this.convRepo.buscarActivos(cmd.tenantId);
    if (!activas.ok) return err({ kind: "persistence_failure", cause: activas.error.cause });

    const existente = activas.value.find(c => c.contactId === cmd.contactId && c.primaryChannel === cmd.channel);
    const conv = existente ?? ((r: Result<ConversationState, ConversationError>) =>
      r.ok ? r.value : null)(crearConversacion(cmd.tenantId, cmd.contactId, cmd.channel, cmd.inboxId ? cmd.inboxId as InboxId : null));

    if (!conv) return err({ kind: "contacto_requerido" });

    if (!existente) {
      const guardado = await this.convRepo.guardar(conv);
      if (!guardado.ok) return err({ kind: "persistence_failure", cause: guardado.error.cause });
    }

    return ok(conv.id);
  }
}

type ConversationError = { readonly kind: "contacto_requerido" };