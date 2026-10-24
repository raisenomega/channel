/**
 * HUB by Raisen — S3: productor de borradores supervisados. Compone las piezas del orquestador:
 * contexto REAL (S1) -> razonar (Anthropic via AgentReasoner) -> persistir draft con to/channel en
 * metadata (para que S2 lo envie al aprobar). No envia: solo deja el borrador en la cola. C4 <=75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";
import { EthicsGuard } from "../domain/ethics.guard.ts";
import type { AgentContextService } from "./agent-context.ts";
import type { AgentReasoner } from "./agent-reasoner.ts";
import type { PersistDraftHandler } from "./persist-draft.handler.ts";
import type { AgentDraft } from "../domain/agent-draft.entity.ts";
import type { TenantId, ConversationId, ContactId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import type { NormalizedMessage } from "../../channels/domain/channel.adapter.ts";

export type GenerateDraftError =
  | { readonly kind: "ethics_violation" }
  | { readonly kind: "context_failed"; readonly cause: string }
  | { readonly kind: "llm_failure"; readonly cause: string }
  | { readonly kind: "persist_failed"; readonly cause: string };

export interface GenerateDraftCommand {
  readonly tenantId: TenantId;
  readonly conversationId?: ConversationId | null;
  readonly contactId?: ContactId | null;
  readonly channel: ChannelType;
  readonly personaSlug: string;
  readonly normalizedMessage: NormalizedMessage;
  readonly contactLabel?: string | undefined;  // id/handle del contacto
  readonly contactName?: string | undefined;   // nombre del contacto
  readonly contactPhone?: string | undefined;  // telefono si existe
  readonly scope?: string | undefined;         // targeted | generic
  readonly autoSendReason?: string | undefined; // por que se auto-envio o no (observabilidad)
}

export class GenerateDraftHandler {
  constructor(
    private readonly ctx: AgentContextService,
    private readonly reasoner: AgentReasoner,
    private readonly persist: PersistDraftHandler,
  ) {}

  async ejecutar(cmd: GenerateDraftCommand): Promise<Result<AgentDraft, GenerateDraftError>> {
    const ethics = EthicsGuard.evaluar(cmd.normalizedMessage.content, "");
    if (!ethics.ok) return err({ kind: "ethics_violation" });
    const contexto = await this.ctx.obtener(cmd.normalizedMessage, cmd.tenantId);
    if (!contexto.ok) return err({ kind: "context_failed", cause: contexto.error.cause });
    const razonado = await this.reasoner.razonar(cmd.normalizedMessage, cmd.channel, contexto.value);
    if (!razonado.ok) return err({ kind: "llm_failure", cause: razonado.error.cause });
    const d = await this.persist.ejecutar({
      tenantId: cmd.tenantId, conversationId: cmd.conversationId ?? null, contactId: cmd.contactId ?? null,
      personaSlug: cmd.personaSlug, inboundMessage: cmd.normalizedMessage.content,
      draftContent: razonado.value.response, confidence: 0.5,
      reason: "supervisado: borrador IA para revision humana", aiDisclosureIncluded: false,
      traceId: crypto.randomUUID(), to: cmd.normalizedMessage.from, channel: cmd.channel,
      contactLabel: cmd.contactLabel, contactName: cmd.contactName, contactPhone: cmd.contactPhone, scope: cmd.scope ?? "targeted", autoSendReason: cmd.autoSendReason,
    });
    return d.ok ? ok(d.value) : err({ kind: "persist_failed", cause: (d.error as { causa?: string }).causa ?? (d.error as { kind: string }).kind });
  }
}
