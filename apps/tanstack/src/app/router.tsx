import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { IndexRoute } from "@/routes/_index";
import { LoginRoute } from "@/routes/login";
import { InboxRoute } from "@/routes/inbox";
import { ConversationRoute } from "@/routes/inbox.$conversationId";
import { ChannelsRoute } from "@/routes/channels";
import { AgentRoute } from "@/routes/agent";
import { SettingsRoute } from "@/routes/settings";
import { LegalRoute } from "@/routes/settings.legal";
import { IntegrationsRoute } from "@/routes/settings.integrations";
import { ContactsRoute } from "@/routes/contacts";
import { QuotesRoute } from "@/routes/quotes";
import { OrdersRoute } from "@/routes/orders";
import { PaymentsRoute } from "@/routes/payments";
import { AutomationRoute } from "@/routes/automation";
import { ReportsRoute } from "@/routes/reports";
import { SlaRoute } from "@/routes/settings.sla";

const routeTree = rootRoute.addChildren([
  IndexRoute,
  LoginRoute,
  InboxRoute,
  ConversationRoute,
  ChannelsRoute,
  AgentRoute,
  ContactsRoute,
  QuotesRoute,
  OrdersRoute,
  PaymentsRoute,
  AutomationRoute,
  ReportsRoute,
  SettingsRoute,
  LegalRoute,
  IntegrationsRoute,
  SlaRoute,
]);

const router = createRouter({ routeTree, defaultNotFoundComponent: NotFoundPage });

export default router;

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function NotFoundPage() {
  return <div className="flex h-full items-center justify-center text-muted-foreground">404 — Pagina no encontrada</div>;
}