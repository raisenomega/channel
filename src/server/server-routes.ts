/** HUB by Raisen — Construcción de dependencias y handlers del servidor. */
import { ProcessWebhookHandler } from "../channels/application/process-webhook.handler.ts";
import { buildChannelRouter } from "./channel-router-wrapper.ts";
import { ReceiveMessageHandler } from "../inbox/application/receive-message.handler.ts";
import { SendMessageHandler } from "../inbox/application/send-message.handler.ts";
import { CreateQuoteHandler } from "../commerce/application/create-quote.handler.ts";
import { OptInHandler } from "../compliance/application/opt-in.handler.ts";
import { ListInboxHandler } from "../inbox/application/list-inbox.query.ts";
import { ConversationRepositorySupabase } from "../inbox/infrastructure/conversation.repository.supabase.ts";
import { MessageRepositorySupabase } from "../inbox/infrastructure/message.repository.supabase.ts";
import { ConsentRepositorySupabase } from "../compliance/infrastructure/consent.repository.supabase.ts";
import { GetNotificationsHandler } from "../notifications/application/get-notifications.handler.ts";
import { MarkReadHandler } from "../notifications/application/mark-read.handler.ts";
import { UpdatePreferencesHandler } from "../notifications/application/update-preferences.handler.ts";
import { SupabaseNotificationRepo } from "../notifications/infrastructure/supabase-notification.repo.ts";
import type { AthConfirmDeps } from "../commerce/presentation/routes/ath-movil-confirm.routes.ts";
import { buildAthDeps } from "./ath-wrapper.ts";
import { buildStripe, type StripeDeps } from "./stripe-wrapper.ts";
import { buildPayDeps, type PayDeps } from "./pay-wrapper.ts";
import { buildChannelsDeps } from "./channels-wrapper.ts";
import type { ChannelsDeps } from "../channels/presentation/channels.routes.ts";
import { buildDraftsDeps } from "./drafts-wrapper.ts";
import type { DraftsDeps } from "../cognition/presentation/drafts.routes.ts";
import { buildTemplatesDeps } from "./templates-wrapper.ts";
import type { TemplatesDeps } from "../templates/presentation/templates.routes.ts";
import { IngestZernioMessageHandler } from "../inbox/application/ingest-zernio-message.use-case.ts";
import { tenantPorZernioProfile, mensajeYaExiste, conversacionExiste } from "../inbox/infrastructure/zernio-ingest.queries.ts";
import { detUuid } from "../shared/infrastructure/det-uuid.ts";
import type { NotificationsHandlers } from "../notifications/presentation/routes/notifications.routes.ts";
import type { QuoteRepository } from "../commerce/domain/commerce.repository.ts";
import type { ContactRepository } from "../contacts/domain/contact.repository.ts";
import { ContactRepositorySupabase } from "../contacts/infrastructure/contact.repository.supabase.ts";
export interface ServerHandlers {
  processWebhook: ProcessWebhookHandler;
  receiveMessage: ReceiveMessageHandler;
  ingestZernio: IngestZernioMessageHandler;
  sendMessage: SendMessageHandler;
  contactsRepo: ContactRepository;
  createQuote: CreateQuoteHandler;
  optIn: OptInHandler;
  listInbox: ListInboxHandler;
  notifications: NotificationsHandlers;
  athConfirm: AthConfirmDeps;
  stripe: StripeDeps;
  pay: PayDeps;
  channels: ChannelsDeps;
  drafts: DraftsDeps;
  templates: TemplatesDeps;
}
// QuoteRepository minimo (no hay implementacion Supabase en infrastructure).
const quoteRepo: QuoteRepository = { async guardar() { return { ok: true as const, value: undefined }; }, async buscar() { return { ok: true as const, value: null }; } };
export async function buildHandlers(): Promise<ServerHandlers> {
  const convRepo = new ConversationRepositorySupabase();
  const msgRepo = new MessageRepositorySupabase();
  const consentRepo = new ConsentRepositorySupabase();
  const channelRouter = await buildChannelRouter();
  const notifRepo = new SupabaseNotificationRepo();
  const ath = buildAthDeps();
  const pay = buildPayDeps();
  const channels = buildChannelsDeps();
  const drafts = buildDraftsDeps(channelRouter);
  const templates = await buildTemplatesDeps();
  return {
    processWebhook: new ProcessWebhookHandler(channelRouter),
    receiveMessage: new ReceiveMessageHandler(convRepo),
    ingestZernio: new IngestZernioMessageHandler({ contacts: new ContactRepositorySupabase(), convs: convRepo, msgs: msgRepo, tenantPorProfile: tenantPorZernioProfile, mensajeExiste: mensajeYaExiste, convExiste: conversacionExiste, detId: detUuid }),
    sendMessage: new SendMessageHandler(convRepo, msgRepo),
    contactsRepo: new ContactRepositorySupabase(),
    createQuote: new CreateQuoteHandler(quoteRepo),
    optIn: new OptInHandler(consentRepo),
    listInbox: new ListInboxHandler(convRepo),
    notifications: { getHandler: new GetNotificationsHandler(notifRepo), markReadHandler: new MarkReadHandler(notifRepo), updatePrefsHandler: new UpdatePreferencesHandler(notifRepo) },
    athConfirm: ath.confirm, stripe: buildStripe(),
    pay, channels, drafts, templates,
  };
}