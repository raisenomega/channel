/**
 * HUB by Raisen — S6/S7b: al entrar un mensaje, si el negocio no esta 'off', el agente genera un BORRADOR y
 * (en autonomo, si pasan los guardrails) lo auto-ENVIA. Devuelve un RESULTADO (respondio/no_send/error) para
 * que el ejecutor robusto reintente los errores transitorios (antes se tragaban en silencio). C4 <=75. Sin any.
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
export interface AutoSendPort { enviar(draft: AgentDraft, to: string, channel: string): Promise<boolean>; } // true = enviado
export interface SentCounterPort { contar(tenantId: string): Promise<number>; }
export interface AutodraftOutcome { readonly outcome: "responded" | "no_send" | "error"; readonly reason: string; }

export interface AutodraftEvent {
  readonly tenantId: string; readonly conversationId?: string | null; readonly contactId?: string | null;
  readonly channel: string; readonly from: string; readonly content: string;
  readonly contactName?: string; readonly contactPhone?: string; readonly persona?: string;
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
    private readonly postHook?: (ev: AutodraftEvent, opportunity: boolean, mode: string) => Promise<string | null>,
  ) {}

  async ejecutar(ev: AutodraftEvent): Promise<AutodraftOutcome> {
    try {
      if (!ev.content || !ev.content.trim() || !ev.from) return { outcome: "no_send", reason: "vacio" };
      const { mode, config, timeZone } = await this.flag.leer(ev.tenantId);
      if (mode === "off") return { outcome: "no_send", reason: "off" };
      const intent = await this.classifier.clasificar(ev.content);
      if (ev.contactId && this.calificar) await this.calificar(String(ev.contactId), intent.opportunity);
      const quoteUrl = this.postHook ? await this.postHook(ev, intent.opportunity, mode) : null;
      // Lazo cerrado: si la cotizacion SALIO, el mensaje del link ES la respuesta -> no generamos reply redundante (ni "se la enviaremos")
      if (quoteUrl) return { outcome: "responded", reason: "quote_sent" };
      const sentToday = mode === "autonomous" && this.counter ? await this.counter.contar(ev.tenantId) : 0;
      const complaint = intent.persona === "angel" || intent.kind === "queja";
      const signals = { opportunity: intent.opportunity, complaint, newContact: false, confidence: intent.confidence, channel: ev.channel, sentToday };
      const dec = razonAutoEnvio(mode, config, signals, new Date(), timeZone);
      if (mode === "autonomous" && !dec.send) return { outcome: "no_send", reason: dec.reason };
      const perfil = ev.contactId && this.perfilContacto ? await this.perfilContacto(String(ev.contactId)) : null;
      const nm: NormalizedMessage = { providerMessageId: crypto.randomUUID(), from: ev.from, channel: ev.channel as ChannelType, content: ev.content, attachments: [] };
      const draft = await this.generate.ejecutar({
        tenantId: ev.tenantId as unknown as TenantId, conversationId: (ev.conversationId ?? null) as ConversationId | null,
        contactId: (ev.contactId ?? null) as ContactId | null, channel: ev.channel as ChannelType, personaSlug: ev.persona ?? intent.persona,
        normalizedMessage: nm, contactLabel: ev.from, contactName: ev.contactName, contactPhone: ev.contactPhone,
        scope: intent.opportunity ? "opportunity" : "targeted", autoSendReason: dec.reason, contactProfile: perfil ?? undefined,
      });
      if (!draft.ok) return { outcome: "error", reason: `generate:${draft.error.kind}` }; // fallo transitorio -> reintentar
      if (dec.send && this.autoSend) { const sent = await this.autoSend.enviar(draft.value, ev.from, ev.channel); return sent ? { outcome: "responded", reason: dec.reason } : { outcome: "error", reason: "send_failed" }; }
      return { outcome: "no_send", reason: "borrador_sin_envio" };
    } catch (e) { return { outcome: "error", reason: e instanceof Error ? e.message : String(e) }; }
  }
}
