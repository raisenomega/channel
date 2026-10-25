/**
 * HUB by Raisen — S6/S7b: al entrar un mensaje, si el negocio no esta 'off', el agente genera un BORRADOR.
 * Si el modo es 'autonomous' Y pasan TODOS los guardrails (debeAutoEnviar), lo auto-ENVIA; si no, queda en
 * Borradores. Fire-and-forget: nunca rompe el inbound. C4 <=75. Sin any.
 */
import type { GenerateDraftHandler } from "./generate-draft.handler.ts";
import type { IntentClassifier } from "./intent-classifier.ts";
import type { AgentsConfig } from "../domain/agents-config.ts";
import { razonAutoEnvio } from "../domain/autonomy-decision.ts";
import type { AgentDraft } from "../domain/agent-draft.entity.ts";
import type { TenantId, ConversationId, ContactId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import type { NormalizedMessage } from "../../channels/domain/channel.adapter.ts";

export interface AutodraftFlagPort { leer(tenantId: string): Promise<{ mode: string; config: AgentsConfig; timeZone?: string | undefined }>; }
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
    private readonly perfilContacto?: (contactId: string) => Promise<string | null>,
    private readonly calificar?: (contactId: string, opportunity: boolean) => Promise<string | null>,
    private readonly postHook?: (ev: AutodraftEvent, opportunity: boolean) => Promise<void>, // captura datos + cotizacion
  ) {}

  async ejecutar(ev: AutodraftEvent): Promise<void> {
    try {
      if (!ev.content || !ev.content.trim() || !ev.from) return;
      const { mode, config, timeZone } = await this.flag.leer(ev.tenantId);
      console.error(`[autodraft] t=${ev.tenantId} ch=${ev.channel} from=${ev.from} mode=${mode}`);
      if (mode === "off") return;
      const intent = await this.classifier.clasificar(ev.content);
      if (ev.contactId && this.calificar) { const subio = await this.calificar(String(ev.contactId), intent.opportunity); if (subio) console.error(`[qualify] contacto=${ev.contactId} -> ${subio}`); }
      if (this.postHook) await this.postHook(ev, intent.opportunity); // captura de datos + propuesta de cotizacion (gated, no bloquea)
      const sentToday = mode === "autonomous" && this.counter ? await this.counter.contar(ev.tenantId) : 0;
      const complaint = intent.persona === "angel" || intent.kind === "queja";
      const signals = { opportunity: intent.opportunity, complaint, newContact: false, confidence: intent.confidence, channel: ev.channel, sentToday };
      const dec = razonAutoEnvio(mode, config, signals, new Date(), timeZone);
      console.error(`[autodraft] send=${dec.send} reason=${dec.reason} conf=${intent.confidence} hasAutoSend=${!!this.autoSend}`);
      if (mode === "autonomous" && !dec.send) return; // Sistema A: en autonomo respondemos o nada; nunca dejamos borrador por mensaje (eso es Sistema B)
      const perfil = ev.contactId && this.perfilContacto ? await this.perfilContacto(String(ev.contactId)) : null;
      const nm: NormalizedMessage = { providerMessageId: crypto.randomUUID(), from: ev.from, channel: ev.channel as ChannelType, content: ev.content, attachments: [] };
      const draft = await this.generate.ejecutar({
        tenantId: ev.tenantId as unknown as TenantId,
        conversationId: (ev.conversationId ?? null) as ConversationId | null,
        contactId: (ev.contactId ?? null) as ContactId | null,
        channel: ev.channel as ChannelType, personaSlug: ev.persona ?? intent.persona,
        normalizedMessage: nm, contactLabel: ev.from, contactName: ev.contactName, contactPhone: ev.contactPhone,
        scope: intent.opportunity ? "opportunity" : "targeted", autoSendReason: dec.reason, contactProfile: perfil ?? undefined,
      });
      if (draft.ok && dec.send && this.autoSend) { console.error(`[autodraft] auto-enviando to=${ev.from} ch=${ev.channel}`); await this.autoSend.enviar(draft.value, ev.from, ev.channel); }
      else console.error(`[autodraft] NO envia draftOk=${draft.ok} send=${dec.send} hasAutoSend=${!!this.autoSend}`);
    } catch (e) { console.error(`[autodraft] ERROR`, e instanceof Error ? e.message : e); }
  }
}
