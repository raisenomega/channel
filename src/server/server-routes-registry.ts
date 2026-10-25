/**
 * HUB by Raisen — Registro de todas las rutas del servidor HTTP.
 */
import type { ServerHandlers } from "./server-routes.ts";
import type { RouteDefinition } from "./server-types.ts";
import { handleWebhook, handleReceive, handleSend } from "./server-routes-messaging.ts";
import { handleQuote, handleOptIn, handleListInbox } from "./server-routes-commerce.ts";
import { rutaInitSignup, rutaCallbackMeta } from "../channels/meta/presentation/routes/oauth.routes.ts";
import { rutaWebhookVerify, rutaWebhookReceive } from "../channels/whatsapp-cloud/presentation/routes/webhook.routes.ts";
import { rutaGetNotifications, rutaMarkRead, rutaUpdatePreferences } from "../notifications/presentation/routes/notifications.routes.ts";
import { rutaAthMovilConfirm } from "../commerce/presentation/routes/ath-movil-confirm.routes.ts";
import { rutaStripeWebhook } from "../commerce/presentation/routes/stripe-webhook.routes.ts";
import { rutaStripeOnboarding } from "../commerce/presentation/routes/stripe-onboarding.routes.ts";
import { rutaStripePrepare } from "../commerce/presentation/routes/stripe-prepare.routes.ts";
import { rutaLandingPage } from "../pay/presentation/routes/landing-page.routes.ts";
import { rutaAthCharge } from "../pay/presentation/routes/charge-ath.routes.ts";
import { rutaAthPoll } from "../pay/presentation/routes/ath-poll.routes.ts";
import { rutaPagoSuccess, rutaPagoFailed } from "../pay/presentation/routes/pago-result.routes.ts";
import { rutaConnectUrl, rutaZernioSync, rutaConnectedAccounts, rutaListChannels } from "../channels/presentation/channels.routes.ts";
import { rutaToggleCanal } from "../channels/presentation/routes/channel-toggle.routes.ts";
import { registrarOAuthChannelsRutas } from "./oauth-channels-wrapper.ts";
import { handleZernioWebhook } from "../channels/presentation/webhooks.zernio.routes.ts";
import { rutaCrearTenant } from "../identity/presentation/tenants.routes.ts"; import { rutaLeerPerfilTenant } from "../identity/presentation/tenant-profile.routes.ts";
import { rutaActualizarTenant } from "../identity/presentation/tenant-update.routes.ts";
import { TenantRepositorySupabase } from "../identity/infrastructure/tenant.repository.supabase.ts";
import { rutaAgentStatus } from "../cognition/presentation/agents.routes.ts";
import { rutaRecentActivity } from "../notifications/presentation/activity.routes.ts";
import { rutaHealth } from "./health.routes.ts"; import { rutaOAuthCallback } from "./oauth-callback.routes.ts";
import { rutaDraftsPending, rutaDraftsApprove, rutaDraftsReject, rutaDraftsWasCorrect } from "../cognition/presentation/drafts.routes.ts"; import { rutaContactActivity } from "../cognition/presentation/contact-activity.routes.ts"; import { rutaCotizacionesRechazadas } from "../cognition/presentation/rejected-quotes.routes.ts"; import { rutaAgentMetrics } from "../cognition/presentation/agent-metrics.routes.ts";
import { rutaCrearTemplate, rutaListarTemplates, rutaPatchTemplate, rutaImportLibrary } from "../templates/presentation/templates.routes.ts"; import { rutaMediaProxy } from "./media-proxy-route.ts"; import { rutaVictorChat } from "../cognition/presentation/victor-chat.routes.ts"; import { VictorChatHandler } from "../cognition/application/victor-chat.handler.ts"; import { AnthropicAdapter } from "../cognition/infrastructure/anthropic.adapter.ts"; import { getEnv } from "../shared/infrastructure/supabase-rest.helper.ts"; import { rutaContextoGet, rutaContextoPut } from "../cognition/presentation/context.routes.ts"; import { rutaGenerateDraft } from "../cognition/presentation/generate-draft.routes.ts"; import { GenerateDraftHandler } from "../cognition/application/generate-draft.handler.ts"; import { AgentContextService } from "../cognition/application/agent-context.ts"; import { AgentContextSourceSupabase } from "../cognition/infrastructure/agent-context-source.supabase.ts"; import { AgentReasoner } from "../cognition/application/agent-reasoner.ts"; import { PersistDraftHandler } from "../cognition/application/persist-draft.handler.ts"; import { AgentDraftsRepository } from "../cognition/infrastructure/agent-drafts.repository.ts"; import { ConversationRepositorySupabase } from "../inbox/infrastructure/conversation.repository.supabase.ts"; import { MessageRepositorySupabase } from "../inbox/infrastructure/message.repository.supabase.ts"; import { rutaAgentModeGet, rutaAgentModePut, rutaAgentConfigGet, rutaAgentConfigPut } from "../cognition/presentation/agents-mode.routes.ts";

export function registrarRutas(h: ServerHandlers): RouteDefinition[] {
  return [
    rutaHealth(), rutaMediaProxy(), rutaVictorChat({ chat: new VictorChatHandler(), provider: new AnthropicAdapter(getEnv("ANTHROPIC_API_KEY") ?? "") }), rutaContextoGet(), rutaContextoPut(), rutaAgentModeGet(), rutaAgentModePut(), rutaAgentConfigGet(), rutaAgentConfigPut(), rutaGenerateDraft({ generate: new GenerateDraftHandler(new AgentContextService(new AgentContextSourceSupabase()), new AgentReasoner(new AnthropicAdapter(getEnv("ANTHROPIC_API_KEY") ?? "")), new PersistDraftHandler(new AgentDraftsRepository())), conversations: new ConversationRepositorySupabase(), messages: new MessageRepositorySupabase() }), handleWebhook(h),
    handleReceive(h),
    handleSend(h),
    handleQuote(h),
    handleOptIn(h),
    handleListInbox(h),
    rutaInitSignup(),
    rutaCallbackMeta(),
    rutaWebhookVerify(),
    rutaWebhookReceive(),
    rutaGetNotifications(h.notifications),
    rutaMarkRead(h.notifications),
    rutaUpdatePreferences(h.notifications),
    rutaAthMovilConfirm(h.athConfirm),
    rutaStripeWebhook(h.stripe),
    rutaStripeOnboarding(h.stripe),
    rutaStripePrepare(h.stripe.prepare),
    rutaLandingPage(h.pay.landing),
    rutaAthCharge(h.pay.charge),
    rutaAthPoll(h.pay.poll),
    rutaPagoSuccess(h.pay.result),
    rutaPagoFailed(h.pay.result),
    rutaConnectUrl(h.channels), rutaZernioSync(h.channels),
    rutaConnectedAccounts(h.channels), rutaListChannels(h.channels),
    rutaToggleCanal(h.channels.repo),
    ...registrarOAuthChannelsRutas(),
    handleZernioWebhook(h),
    rutaCrearTenant(), rutaLeerPerfilTenant(),
    ((r) => rutaActualizarTenant({ buscar: (id) => r.buscar(id), actualizarTelefono: (id, p) => r.actualizarTelefono(id, p), actualizarPerfil: (id, c) => r.actualizarPerfil(id, c) }))(new TenantRepositorySupabase()), // R-3/R-4/S-10 PATCH /tenants/:id
    rutaAgentStatus(),
    rutaRecentActivity(),
    rutaOAuthCallback(),
    rutaDraftsPending(h.drafts), rutaContactActivity(), rutaCotizacionesRechazadas(), rutaAgentMetrics(),
    rutaDraftsApprove(h.drafts),
    rutaDraftsReject(h.drafts),
    rutaDraftsWasCorrect(h.drafts),
    rutaCrearTemplate(h.templates),
    rutaListarTemplates(h.templates),
    rutaPatchTemplate(h.templates),
    rutaImportLibrary(h.templates),
  ];
}
