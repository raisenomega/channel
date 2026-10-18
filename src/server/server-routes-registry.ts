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
import { registrarOAuthChannelsRutas } from "./oauth-channels-wrapper.ts";
import { handleZernioWebhook } from "../channels/presentation/webhooks.zernio.routes.ts";
import { rutaCrearTenant } from "../identity/presentation/tenants.routes.ts";
import { rutaActualizarTenant } from "../identity/presentation/tenant-update.routes.ts";
import { TenantRepositorySupabase } from "../identity/infrastructure/tenant.repository.supabase.ts";
import { rutaAgentStatus } from "../cognition/presentation/agents.routes.ts";
import { rutaRecentActivity } from "../notifications/presentation/activity.routes.ts";
import { rutaOAuthCallback } from "./oauth-callback.routes.ts";
import { rutaDraftsPending, rutaDraftsApprove, rutaDraftsReject, rutaDraftsWasCorrect } from "../cognition/presentation/drafts.routes.ts";
import { rutaCrearTemplate, rutaListarTemplates, rutaPatchTemplate, rutaImportLibrary } from "../templates/presentation/templates.routes.ts";

export function registrarRutas(h: ServerHandlers): RouteDefinition[] {
  return [
    handleWebhook(h),
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
    rutaConnectUrl(h.channels),
    rutaZernioSync(h.channels),
    rutaConnectedAccounts(h.channels),
    rutaListChannels(h.channels),
    ...registrarOAuthChannelsRutas(),
    handleZernioWebhook(h),
    rutaCrearTenant(),
    ((r) => rutaActualizarTenant({ buscar: (id) => r.buscar(id), actualizarTelefono: (id, p) => r.actualizarTelefono(id, p) }))(new TenantRepositorySupabase()), // R-3/R-4 PATCH /tenants/:id
    rutaAgentStatus(),
    rutaRecentActivity(),
    rutaOAuthCallback(),
    rutaDraftsPending(h.drafts),
    rutaDraftsApprove(h.drafts),
    rutaDraftsReject(h.drafts),
    rutaDraftsWasCorrect(h.drafts),
    rutaCrearTemplate(h.templates),
    rutaListarTemplates(h.templates),
    rutaPatchTemplate(h.templates),
    rutaImportLibrary(h.templates),
  ];
}
