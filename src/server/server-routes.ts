/**
 * HUB by Raisen — Construcción de dependencias y handlers del servidor.
 */
import { ProcessWebhookHandler } from "../channels/application/process-webhook.handler.ts";
import { ChannelRouter } from "../channels/application/channel.router.ts";
import { DevChannelAdapter } from "../channels/infrastructure/dev-channel.adapter.ts";
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
import { SupabasePaymentRepo } from "../commerce/infrastructure/supabase-payment.repo.ts";
import { SupabasePaymentMethodsConfigRepo } from "../commerce/infrastructure/supabase-payment-methods-config.repo.ts";
import { AthMovilApiClient } from "../commerce/infrastructure/ath-movil-api.client.ts";
import { buildStripe } from "./stripe-wrapper.ts";
import type { StripeWebhookDeps } from "../commerce/presentation/routes/stripe-webhook.routes.ts";
import type { StripeOnboardingDeps } from "../commerce/presentation/routes/stripe-onboarding.routes.ts";
import type { AthWebhookDeps } from "../commerce/presentation/routes/ath-movil-webhook.routes.ts";
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
  athMovil: AthWebhookDeps;
  stripe: StripeWebhookDeps & StripeOnboardingDeps;
}

/** QuoteRepository minimo (no hay implementacion Supabase en infrastructure). */
const quoteRepo: QuoteRepository = {
  async guardar() { return { ok: true as const, value: undefined }; },
  async buscar() { return { ok: true as const, value: null }; },
};

export function buildHandlers(): ServerHandlers {
  const convRepo = new ConversationRepositorySupabase();
  const msgRepo = new MessageRepositorySupabase();
  const consentRepo = new ConsentRepositorySupabase();
  const channelRouter = new ChannelRouter();
  channelRouter.registrar(new DevChannelAdapter());
  const notifRepo = new SupabaseNotificationRepo();
  const paymentRepo = new SupabasePaymentRepo();
  const configRepo = new SupabasePaymentMethodsConfigRepo();

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
    athMovil: {
      paymentRepo,
      configRepo,
      makeClient: (env, publicToken, privateToken) => new AthMovilApiClient(env, privateToken, publicToken),
    },
    stripe: buildStripe(),
  };
}