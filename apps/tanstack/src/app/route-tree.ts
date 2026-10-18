import { rootRoute } from "./root";
import { IndexRoute } from "@/routes/_index";
import { LoginRoute } from "@/routes/login";
import { InboxRoute } from "@/routes/inbox";
import { ConversationRoute } from "@/routes/inbox.$conversationId";
import { ChannelsRoute } from "@/routes/channels";
import { ZernioReturnRoute } from "@/routes/zernio-return";
import { CanalRoute } from "@/routes/channels.$channelId";
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
import { OnboardingRoute } from "@/routes/onboarding.tenant";
import { TemplatesRoute } from "@/routes/templates";

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  LoginRoute,
  InboxRoute,
  ConversationRoute,
  ChannelsRoute,
  ZernioReturnRoute,
  CanalRoute,
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
  OnboardingRoute,
  TemplatesRoute,
]);