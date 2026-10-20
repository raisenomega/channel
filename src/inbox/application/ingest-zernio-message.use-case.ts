/**
 * HUB by Raisen — Hotfix P bloque 2: ingesta de un mensaje entrante de Zernio en el inbox real.
 * Resuelve tenant (por profileId) -> upsert contacto + conversación (ids DETERMINISTAS = idempotente,
 * sin duplicados) -> inserta el message (dedup por provider_message_id). Lo que faltaba: el persist.
 * Deps inyectadas (capas DDD: la app no toca infra directo). C4 <=75.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId, ContactId, ConversationId, MessageId } from "../../shared/domain/ids.ts";
import { ChannelType } from "../../shared/domain/types.ts";
import { ContactRepository } from "../../contacts/domain/contact.repository.ts";
import { crearContacto } from "../../contacts/domain/contact.entity.ts";
import { ConversationRepository } from "../domain/inbox.repository.ts";
import { crearConversacion } from "../domain/conversation.entity.ts";
import { MessageState } from "../domain/message.entity.ts";
import { parseZernioMessage } from "./zernio-message.parser.ts";

export interface MsgPort { guardar(m: MessageState): Promise<Result<void, { readonly kind: string; readonly cause?: string }>>; }
export interface IngestDeps {
  readonly contacts: ContactRepository;
  readonly convs: ConversationRepository;
  readonly msgs: MsgPort;
  readonly tenantPorProfile: (profileId: string) => Promise<TenantId | null>;
  readonly mensajeExiste: (t: TenantId, pmid: string) => Promise<boolean>;
  readonly detId: (seed: string) => string;
}
export type IngestError = { kind: "shape_ignorado" } | { kind: "tenant_no_encontrado" } | { kind: "persistence_failure"; cause: string };
const fail = (cause: string): Result<never, IngestError> => err({ kind: "persistence_failure", cause });

export class IngestZernioMessageHandler {
  constructor(private readonly d: IngestDeps) {}

  async ejecutar(payload: unknown): Promise<Result<{ persisted: boolean }, IngestError>> {
    const z = parseZernioMessage(payload);
    if (!z) return err({ kind: "shape_ignorado" });
    const tenantId = await this.d.tenantPorProfile(z.profileId);
    if (!tenantId) return err({ kind: "tenant_no_encontrado" });
    if (await this.d.mensajeExiste(tenantId, z.providerMessageId)) return ok({ persisted: false }); // idempotente
    const contactId = this.d.detId(`ct:${tenantId}:${z.senderId}`) as ContactId;
    const convId = this.d.detId(`cv:${tenantId}:${z.channel}:${z.senderId}`) as ConversationId;
    const ch = z.channel as ChannelType;
    const c = crearContacto(tenantId, z.senderName);
    if (c.ok && !(await this.d.contacts.guardar({ ...c.value, id: contactId })).ok) return fail("contacto");
    const cv = crearConversacion(tenantId, contactId, ch);
    if (cv.ok && !(await this.d.convs.guardar({ ...cv.value, id: convId })).ok) return fail("conversacion");
    const msg: MessageState = {
      id: crypto.randomUUID() as MessageId, tenantId, conversationId: convId, contactId,
      direction: z.direction, senderType: "contact", senderUserId: null, channel: ch,
      provider: "zernio", providerMessageId: z.providerMessageId, content: { type: "text", body: z.content },
      hasAttachments: false, status: "received", aiMeta: { interactionId: null, confidence: null, mode: null, editedByHuman: false },
      createdAt: new Date(),
    };
    const mr = await this.d.msgs.guardar(msg);
    if (!mr.ok) return fail(mr.error.cause ?? "mensaje"); // #171: propaga el error REAL de Postgres (diagnosticable)
    return ok({ persisted: true });
  }
}
