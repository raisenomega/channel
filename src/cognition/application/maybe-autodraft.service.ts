/**
 * HUB by Raisen — S6/S7b: al entrar un mensaje, si el negocio no esta 'off', el agente genera un BORRADOR.
 * Si el modo es 'autonomous' Y pasan TODOS los guardrails (debeAutoEnviar), lo auto-ENVIA; si no, queda en
 * Borradores. Fire-and-forget: nunca rompe el inbound. C4 <=75. Sin any.
 */
import type { GenerateDraftHandler } from "./generate-draft.handler.ts";
import type { IntentClassifier } from "./intent-classifier.ts";
import type { AgentsConfig } from "../domain/agents-config.ts";
import { debeAutoEnviar } from "../domain/autonomy-decision.ts";
import type { AgentDraft } from "../domain/agent-draft.entity.ts";
import type { TenantId, ConversationId, ContactId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import type { NormalizedMessage } from "../../channels/domain/channel.adapter.ts";

export interface AutodraftFlagPort { leer(tenantId: string): Promise<{ mode: string; config: AgentsConfig }>; }
export interface AutoSendPort { enviar(draft: AgentDraft, to: string, channel: string): Promise<void>; }
export interface SentCounterPort { contar(tenantId: string): Promise<number>; }

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
  constructor(
    private readonly flag: AutodraftFlagPort,
    private readonly generate: GenerateDraftHandler,
    private readonly classifier: IntentClassifier,
    private readonly autoSend?: AutoSendPort,
    private readonly counter?: SentCounterPort,
  ) {}

  async ejecutar(ev: AutodraftEvent): Promise<void> {
    try {
      if (!ev.content || !ev.content.trim() || !ev.from) return;
      const { mode, config } = await this.flag.leer(ev.tenantId);
      if (mode === "off") return;
      const intent = await this.classifier.clasificar(ev.content);
      const nm: NormalizedMessage = { providerMessageId: crypto.randomUUID(), from: ev.from, channel: ev.channel as ChannelType, content: ev.content, attachments: [] };
      const draft = await this.generate.ejecutar({
        tenantId: ev.tenantId as unknown as TenantId,
        conversationId: (ev.conversationId ?? null) as ConversationId | null,
        contactId: (ev.contactId ?? null) as ContactId | null,
        channel: ev.channel as ChannelType, personaSlug: ev.persona ?? intent.persona,
        normalizedMessage: nm, contactLabel: ev.from, contactName: ev.contactName, contactPhone: ev.contactPhone,
        scope: intent.opportunity ? "opportunity" : "targeted",
      });
      if (!draft.ok || mode !== "autonomous" || !this.autoSend) return;
      const sentToday = this.counter ? await this.counter.contar(ev.tenantId) : 0;
      const complaint = intent.persona === "angel" || intent.kind === "queja";
      const signals = { opportunity: intent.opportunity, complaint, newContact: false, confidence: intent.confidence, channel: ev.channel, sentToday };
      if (debeAutoEnviar(mode, config, signals, new Date())) await this.autoSend.enviar(draft.value, ev.from, ev.channel);
    } catch { /* enriquece, no bloquea */ }
  }
}
