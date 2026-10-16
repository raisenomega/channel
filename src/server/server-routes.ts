/**
 * HUB by Raisen — Construcción de dependencias y handlers del servidor.
 */
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
import { buildStripe } from "./stripe-wrapper.ts";
import type { StripeDeps } from "./stripe-wrapper.ts";
import { buildPayDeps } from "./pay-wrapper.ts";
import type { PayDeps } from "./pay-wrapper.ts";
import { buildChannelsDeps } from "./channels-wrapper.ts";
import type { ChannelsDeps } from "../channels/presentation/channels.routes.ts";
import type { NotificationsHandlers } from "../notifications/presentation/routes/notifications.routes.ts";
import type { QuoteRepository } from "../commerce/domain/commerce.repository.ts";

export interface ServerHandlers {
  processWebhook: ProcessWebhookHandler;
  receiveMessage: ReceiveMessageHandler;
  sendMessage: SendMessageHandler;
  createQuote: CreateQuoteHandler;
  optIn: OptInHandler;
  listInbox: ListInboxHandler;
  notifications: NotificationsHandlers;
  athConfirm: AthConfirmDeps;
  stripe: StripeDeps;
  pay: PayDeps;
  channels: ChannelsDeps;
}

/** QuoteRepository minimo (no hay implementacion Supabase en infrastructure). */
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

  return {
    processWebhook: new ProcessWebhookHandler(channelRouter),
    receiveMessage: new ReceiveMessageHandler(convRepo),
    sendMessage: new SendMessageHandler(convRepo, msgRepo),
    createQuote: new CreateQuoteHandler(quoteRepo),
    optIn: new OptInHandler(consentRepo),
    listInbox: new ListInboxHandler(convRepo),
    notifications: {
      getHandler: new GetNotificationsHandler(notifRepo),
      markReadHandler: new MarkReadHandler(notifRepo),
      updatePrefsHandler: new UpdatePreferencesHandler(notifRepo),
    },
    athConfirm: ath.confirm,
    stripe: buildStripe(),
    pay,
    channels,
  };
}