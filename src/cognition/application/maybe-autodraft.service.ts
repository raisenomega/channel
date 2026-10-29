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
import { transcribirAudio } from "../infrastructure/audio-transcribe.ts";

export interface AutodraftFlagPort { leer(tenantId: string): Promise<{ mode: string; config: AgentsConfig; timeZone?: string | undefined }>; }
export interface AutoSendPort { enviar(draft: AgentDraft, to: string, channel: string): Promise<boolean>; } // true = enviado
export interface SentCounterPort { contar(tenantId: string): Promise<number>; }
export interface AutodraftOutcome { readonly outcome: "responded" | "no_send" | "error"; readonly reason: string; }

export interface AutodraftEvent {
  readonly tenantId: string; readonly conversationId?: string | null; readonly contactId?: string | null;
  readonly channel: string; readonly from: string; readonly content: string;
  readonly contactName?: string; readonly contactPhone?: string; readonly persona?: string;
  readonly mediaUrl?: string | undefined; readonly mediaMime?: string | undefined; readonly contentType?: string | undefined; // vision: imagen del inbound -> el agente la VE
}

export class MaybeAutodraftService {
  constructor(
    private readonly flag: AutodraftFlagPort, private readonly generate: GenerateDraftHandler, private readonly classifier: IntentClassifier,
    private readonly autoSend?: AutoSendPort, private readonly counter?: SentCounterPort,
    private readonly perfilContacto?: (contactId: string) => Promise<string | null>, private readonly calificar?: (contactId: string, opportunity: boolean) => Promise<string | null>,
    private readonly postHook?: (ev: AutodraftEvent, opportunity: boolean, mode: string) => Promise<string | null>,
    private readonly presencia?: (convId: string) => Promise<{ humano: boolean; ia: boolean }>, // B: gate de coherencia (presencia humana + debounce IA)
  ) {}

  async ejecutar(ev: AutodraftEvent): Promise<AutodraftOutcome> {
    const t0 = Date.now(); // #4 instrumentacion (solo medicion, sin cambiar logica)
    try {
      if (!ev.content || !ev.content.trim() || !ev.from) return { outcome: "no_send", reason: "vacio" };
      const { mode, config, timeZone } = await this.flag.leer(ev.tenantId);
      if (mode === "off") return { outcome: "no_send", reason: "off" };
      const voz = ev.contentType === "audio" && ev.mediaUrl ? await transcribirAudio(ev.mediaUrl, ev.mediaMime ?? "") : ""; // STT: nota de voz -> texto
      const contenido = voz ? "[Nota de voz] " + voz : ev.content; // el agente LEE lo que el cliente dijo por audio
      const intent = await this.classifier.clasificar(contenido);
      if (ev.contactId && this.calificar) await this.calificar(String(ev.contactId), intent.opportunity);
      const tq = Date.now(); const quoteUrl = this.postHook ? await this.postHook(ev, intent.opportunity, mode) : null; const dQuote = Date.now() - tq;
      // Lazo cerrado: si la cotizacion SALIO, el mensaje del link ES la respuesta -> no generamos reply redundante (ni "se la enviaremos")
      if (quoteUrl) { console.error(`[autodraft-timing] quote=${dQuote}ms total=${Date.now() - t0}ms ch=${ev.channel} -> quote_sent`); return { outcome: "responded", reason: "quote_sent" }; }
      const sentToday = mode === "autonomous" && this.counter ? await this.counter.contar(ev.tenantId) : 0;
      const complaint = intent.persona === "angel" || intent.kind === "queja";
      const signals = { opportunity: intent.opportunity, complaint, newContact: false, confidence: intent.confidence, channel: ev.channel, sentToday };
      const dec = razonAutoEnvio(mode, config, signals, new Date(), timeZone);
      if (mode === "autonomous" && !dec.send && !config.channels.includes(ev.channel)) return { outcome: "no_send", reason: dec.reason }; // canal no autorizado -> dropea (anti-ruido). Revision/confianza NO dropea: sigue y deja BORRADOR
      const perfil = ev.contactId && this.perfilContacto ? await this.perfilContacto(String(ev.contactId)) : null;
      const nm: NormalizedMessage = { providerMessageId: crypto.randomUUID(), from: ev.from, channel: ev.channel as ChannelType, content: contenido, attachments: [] };
      const tg = Date.now();
      const draft = await this.generate.ejecutar({
        tenantId: ev.tenantId as unknown as TenantId, conversationId: (ev.conversationId ?? null) as ConversationId | null,
        contactId: (ev.contactId ?? null) as ContactId | null, channel: ev.channel as ChannelType, personaSlug: ev.persona ?? intent.persona,
        normalizedMessage: nm, contactLabel: ev.from, contactName: ev.contactName, contactPhone: ev.contactPhone,
        scope: intent.opportunity ? "opportunity" : "targeted", autoSendReason: dec.reason, contactProfile: perfil ?? undefined,
        mediaUrl: ev.contentType === "image" ? ev.mediaUrl : undefined, mediaMime: ev.mediaMime, // vision: solo imagenes se bajan al LLM
      });
      const dReason = Date.now() - tg;
      console.error(`[autodraft-timing] quote=${dQuote}ms reason=${dReason}ms total=${Date.now() - t0}ms ch=${ev.channel} send=${dec.send}`);
      if (!draft.ok) return { outcome: "error", reason: `generate:${draft.error.kind}` }; // fallo transitorio -> reintentar
      if (dec.send && this.autoSend) {
        const pr = this.presencia && ev.conversationId ? await this.presencia(String(ev.conversationId)) : { humano: false, ia: false }; // B pres. humana/debounce; C: escalado = consulta/escalar en curso -> no mando "voy a confirmar"
        const esc = this.presencia && (draft.value.metadata as { escalado?: string } | undefined)?.escalado ? "consulta_en_curso" : pr.humano ? "humano_presente" : pr.ia ? "debounce_ia" : ""; if (esc) return { outcome: "no_send", reason: esc };
        const sent = await this.autoSend.enviar(draft.value, ev.from, ev.channel); return sent ? { outcome: "responded", reason: dec.reason } : { outcome: "error", reason: "send_failed" }; }
      return { outcome: "no_send", reason: "borrador_sin_envio" };
    } catch (e) { return { outcome: "error", reason: e instanceof Error ? e.message : String(e) }; }
  }
}
