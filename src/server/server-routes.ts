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
import type { QuoteRepository } from "../commerce/domain/commerce.repository.ts";

export interface ServerHandlers {
  processWebhook: ProcessWebhookHandler;
  receiveMessage: ReceiveMessageHandler;
  sendMessage: SendMessageHandler;
  createQuote: CreateQuoteHandler;
  optIn: OptInHandler;
  listInbox: ListInboxHandler;
}

/** QuoteRepository minimo (no hay implementacion Supabase en infrastructure). */
const quoteRepo: QuoteRepository = {
  async guardar() {
    return { ok: true as const, value: undefined };
  },
  async buscar() {
    return { ok: true as const, value: null };
  },
};

export function buildHandlers(): ServerHandlers {
  const convRepo = new ConversationRepositorySupabase();
  const msgRepo = new MessageRepositorySupabase();
  const consentRepo = new ConsentRepositorySupabase();
  const channelRouter = new ChannelRouter();
  channelRouter.registrar(new DevChannelAdapter());

  return {
    processWebhook: new ProcessWebhookHandler(channelRouter),
    receiveMessage: new ReceiveMessageHandler(convRepo),
    sendMessage: new SendMessageHandler(convRepo, msgRepo),
    createQuote: new CreateQuoteHandler(quoteRepo),
    optIn: new OptInHandler(consentRepo),
    listInbox: new ListInboxHandler(convRepo),
  };
}