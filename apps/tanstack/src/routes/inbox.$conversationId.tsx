/**
 * HUB by Raisen — Conversacion: DISPATCHER por scope. cliente (/inbox/$id) -> ClienteConversation
 * (chat + ficha 360 + resueltos, ya funcionando). agente (/inbox/c:{consultaId}) -> ConsultaView
 * (MISMO layout y componentes; solo cambia el scope a AGENTE). C4 <=75.
 */
import { createRoute, useParams, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { ClienteConversation } from "./conversation/cliente-conversation";
import { ConsultaView } from "./conversation/consulta-view";

const ConversationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inbox/$conversationId",
  component: ConversationPage,
});

function ConversationPage() {
  const { conversationId } = useParams({ from: ConversationRoute.id });
  const { language } = usePreferences();
  const navigate = useNavigate();
  const abrir = (id: string) => void navigate({ to: "/inbox/" + id });
  const alInbox = () => void navigate({ to: "/inbox" });
  if (conversationId.startsWith("c:")) {
    return <ConsultaView consultaId={conversationId.slice(2)} language={language} onBack={alInbox} onOpenResuelto={abrir} />;
  }
  return <ClienteConversation conversationId={conversationId} language={language} onBack={alInbox} onOpen={abrir} />;
}

export { ConversationRoute };
