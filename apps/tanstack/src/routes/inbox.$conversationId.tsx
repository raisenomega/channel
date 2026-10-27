/**
 * HUB by Raisen — Hilo de chat + ficha 360. /inbox/$conversationId. N5, C4.
 */
import { useState, useEffect } from "react";
import { createRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import type { Contact360 } from "@/lib/types";
import { fetchMessages } from "./conversation/conversation-messages";
import { resolveContact360 } from "./conversation/conversation-resolver";
import { enviarMensajeConversacion } from "./conversation/conversation-send";
import { ChatPanel } from "./conversation/conversation-chat-panel";
import { ContactPanel } from "./conversation/conversation-contact-panel";

const ConversationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/inbox/$conversationId",
  component: ConversationPage,
});

function ConversationPage() {
  const { conversationId } = useParams({ from: ConversationRoute.id });
  const { language } = usePreferences();
  const navigate = useNavigate();
  const [composerText, setComposerText] = useState("");
  const [sending, setSending] = useState(false);
  const [contact360, setContact360] = useState<Contact360 | null | "loading">("loading");

  const { data: messages, refetch: refetchMessages } = useQuery({ queryKey: ["messages", conversationId], queryFn: () => fetchMessages(conversationId), staleTime: 10_000 });

  useEffect(() => { setContact360("loading"); void resolveContact360(conversationId).then((c) => setContact360(c ?? null)); }, [conversationId]);

  async function handleSend() {
    const text = composerText.trim();
    if (!text || sending) return;
    setSending(true);
    const ok = await enviarMensajeConversacion(conversationId, text); // endpoint real /api/message/send (persiste + envia por Zernio)
    if (ok) { setComposerText(""); void refetchMessages(); }
    setSending(false);
  }

  const c360 = contact360 !== "loading" && contact360 ? contact360 : null;
  return (
    <div className="dash-grid grid gap-4 mt-4">
      <ChatPanel
        conversationId={conversationId}
        contactName={c360?.displayName}
        contactPhone={c360?.primaryPhone}
        messages={messages ?? []}
        language={language}
        onBack={() => void navigate({ to: "/inbox" })}
        composerText={composerText}
        setComposerText={setComposerText}
        onSend={handleSend}
        sending={sending}
      />
      <ContactPanel contact={contact360} language={language} />
    </div>
  );
}

export { ConversationRoute };