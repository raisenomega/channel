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

const routeTree = rootRoute.addChildren([
  IndexRoute,
  LoginRoute,
  InboxRoute,
  ConversationRoute,
  ChannelsRoute,
  AgentRoute,
  SettingsRoute,
  LegalRoute,
]);

const router = createRouter({ routeTree, defaultNotFoundComponent: NotFoundPage });

export default router;

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function NotFoundPage() {
  return <div className="flex h-full items-center justify-center text-muted-foreground">404 — Página no encontrada</div>;
}