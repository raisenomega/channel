/**
 * HUB by Raisen — S6: al entrar un mensaje, si el negocio tiene agents_autodraft='supervised', el agente
 * genera un BORRADOR (no envia) para que el humano lo apruebe. Fire-and-forget: nunca rompe el inbound
 * ("enriquece, no bloquea"). Mismo camino para IG/FB (con conv/contacto) y WhatsApp (sin, null). C4 <=75.
 */
import type { GenerateDraftHandler } from "./generate-draft.handler.ts";
import type { TenantId, ConversationId, ContactId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import type { NormalizedMessage } from "../../channels/domain/channel.adapter.ts";

export interface AutodraftFlagPort { leer(tenantId: string): Promise<string>; }

export interface AutodraftEvent {
  readonly tenantId: string;
  readonly conversationId?: string | null;
  readonly contactId?: string | null;
  readonly channel: string;
  readonly from: string;
  readonly content: string;
  readonly contactName?: string;
  readonly contactPhone?: string;
  readonly persona?: string;
}

export class MaybeAutodraftService {
  constructor(private readonly flag: AutodraftFlagPort, private readonly generate: GenerateDraftHandler) {}

  async ejecutar(ev: AutodraftEvent): Promise<void> {
    try {
      if (!ev.content || !ev.content.trim() || !ev.from) return;
      if ((await this.flag.leer(ev.tenantId)) !== "supervised") return;
      const nm: NormalizedMessage = { providerMessageId: crypto.randomUUID(), from: ev.from, channel: ev.channel as ChannelType, content: ev.content, attachments: [] };
      await this.generate.ejecutar({
        tenantId: ev.tenantId as unknown as TenantId,
        conversationId: (ev.conversationId ?? null) as ConversationId | null,
        contactId: (ev.contactId ?? null) as ContactId | null,
        channel: ev.channel as ChannelType, personaSlug: ev.persona ?? "thao",
        normalizedMessage: nm, contactLabel: ev.from, contactName: ev.contactName, contactPhone: ev.contactPhone, scope: "targeted",
      });
    } catch { /* enriquece, no bloquea */ }
  }
}
