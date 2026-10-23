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
  readonly tenantPorAccount: (accountId: string) => Promise<TenantId | null>;
  readonly mensajeExiste: (t: TenantId, pmid: string) => Promise<boolean>;
  readonly convExiste: (convId: string) => Promise<boolean>;
  readonly setConvRefs: (convId: string, participantExternalId: string, providerConversationId: string, providerAccountId: string) => Promise<void>; // 3o-b/#1: ids de envío Zernio
  readonly refreshContactName: (contactId: string, name: string) => Promise<void>; // #3: auto-update nombre real
  readonly detId: (seed: string) => string;
}
export type IngestError = { kind: "shape_ignorado" } | { kind: "tenant_no_encontrado" } | { kind: "persistence_failure"; cause: string };
const fail = (cause: string): Result<never, IngestError> => err({ kind: "persistence_failure", cause });

export class IngestZernioMessageHandler {
  constructor(private readonly d: IngestDeps) {}

  async ejecutar(payload: unknown): Promise<Result<{ persisted: boolean }, IngestError>> {
    const z = parseZernioMessage(payload);
    if (!z) return err({ kind: "shape_ignorado" });
    // Issue C: primary = tenants.zernio_profile_id; fallback = channel_connections.zernio_account_id.
    const tenantId = (await this.d.tenantPorProfile(z.profileId)) ?? (await this.d.tenantPorAccount(z.accountId));
    if (!tenantId) return err({ kind: "tenant_no_encontrado" });
    if (await this.d.mensajeExiste(tenantId, z.providerMessageId)) return ok({ persisted: false }); // idempotente
    const contactId = this.d.detId(`ct:${tenantId}:${z.contactExternalId}`) as ContactId;
    const convId = this.d.detId(`cv:${tenantId}:${z.channel}:${z.contactExternalId}`) as ConversationId;
    const ch = z.channel as ChannelType;
    if (!(await this.d.convExiste(convId))) { // Issue A: crear 1 sola vez -> no resetea total_messages (lo maneja el trigger 054)
      let c = crearContacto(tenantId, z.contactName, undefined, z.contactPhone || undefined);
      if (!c.ok) c = crearContacto(tenantId, z.contactName); // telefono invalido (ej. id de IG) -> sin telefono; nunca rompe el ingest
      if (c.ok && !(await this.d.contacts.guardar({ ...c.value, id: contactId })).ok) return fail("contacto");
      const cv = crearConversacion(tenantId, contactId, ch);
      if (cv.ok && !(await this.d.convs.guardar({ ...cv.value, id: convId, participantExternalId: z.contactExternalId, providerConversationId: z.providerConversationId, providerAccountId: z.accountId })).ok) return fail("conversacion");
    } else {
      await this.d.setConvRefs(convId, z.contactExternalId, z.providerConversationId, z.accountId); // 3o-b/#1: rellena ids de envío en convs ya existentes
      if (z.contactName !== "Cliente") await this.d.refreshContactName(contactId, z.contactName); // #3: llegó un nombre real -> actualiza
    }
    const ctype = (z.hasAttachments && ["image", "video", "audio", "document", "sticker"].includes(z.mediaType) ? z.mediaType : "text") as MessageState["content"]["type"];
    const msg: MessageState = {
      id: crypto.randomUUID() as MessageId, tenantId, conversationId: convId, contactId,
      direction: z.direction, senderType: z.direction === "inbound" ? "contact" : "human_agent", senderUserId: null, channel: ch,
      provider: "zernio", providerMessageId: z.providerMessageId, content: { type: ctype, body: z.content, mediaUrl: z.mediaUrl || undefined, mediaMime: z.mediaMime || undefined },
      hasAttachments: z.hasAttachments, status: z.direction === "inbound" ? "received" : "sent", aiMeta: { interactionId: null, confidence: null, mode: null, editedByHuman: false },
      createdAt: new Date(),
    };
    const mr = await this.d.msgs.guardar(msg);
    if (!mr.ok) return fail(mr.error.cause ?? "mensaje"); // #171: propaga el error REAL de Postgres (diagnosticable)
    return ok({ persisted: true });
  }
}
