/**
 * HUB by Raisen — Hilo de chat + ficha 360. /inbox/$conversationId. N5, C4.
 */
import { useState, useEffect } from "react";
import { createRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { Contact360 } from "@/lib/types";
import { fetchMessages } from "./conversation/conversation-messages";
import { resolveContact360 } from "./conversation/conversation-resolver";
import { makeAgentMessage } from "./conversation/conversation-format";
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
    const base = supabaseRestBase();
    const headers = supabaseAuthHeaders();
    if (base && headers) {
      try {
        const res = await fetch(`${base}/messages`, {
          method: "POST",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify(makeAgentMessage(conversationId, text)),
        });
        if (res.ok) { setComposerText(""); void refetchMessages(); }
      } catch { /* Silencio: no mock data (N5). */ }
    }
    setSending(false);
  }

  return (
    <div className="dash-grid grid gap-4 mt-4">
      <ChatPanel
        conversationId={conversationId}
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