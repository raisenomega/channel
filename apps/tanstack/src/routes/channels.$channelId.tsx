/**
 * HUB by Raisen — Vista de canal individual con chat nativo.
 * Ruta dinamica /channels/$channelId. Datos reales via Supabase REST (N5).
 * Cabecera estilo app de mensajeria: avatar, nombre, estado en linea, y amenidad.
 * Sin emojis (E0). Sin datos mock.
 */
import { useState } from "react";
import { createRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import { ChannelIcon, type ChannelKind } from "@/components/ui/channel-icon";
import { Button } from "@/components/ui/button";
import { ChatThread, type ChatMsg } from "@/components/dashboard/chat-bubbles";
import type { Mensaje } from "@/lib/types";

export const CanalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/channels/$channelId",
  component: CanalViewPage,
});

const MESSAGE_COLS = [
  "id", "conversation_id", "sender_type", "sender_id",
  "content", "message_type", "created_at",
];

function enc(v: string): string {
  return encodeURIComponent(v);
}

async function fetchChannelMessages(channelId: string): Promise<Mensaje[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const url = `${base}/messages?select=${enc(MESSAGE_COLS.join(","))}` +
    `&channel=eq.${enc(channelId)}&order=created_at.asc&limit=200`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const filas = (await res.json()) as Array<{
      id: string; conversation_id: string; sender_type: string;
      sender_id: string | null; content: string; message_type: string; created_at: string;
    }>;
    return filas.map((r) => ({
      id: String(r.id),
      conversationId: String(r.conversation_id),
      senderType: String(r.sender_type) as Mensaje["senderType"],
      senderId: r.sender_id ? String(r.sender_id) : null,
      content: String(r.content),
      messageType: String(r.message_type ?? "text"),
      createdAt: r.created_at ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

const ACCENT: Record<ChannelKind, string> = {
  whatsapp: "#25D366",
  email: "#4285F4",
  instagram: "#E4405F",
  facebook: "#1877F2",
  telegram: "#26A5E4",
  sms: "#4CAF50",
  x: "#1DA1F2",
  linkedin: "#0A66C2",
  webchat: "#6C63FF",
};

function CanalViewPage() {
  const { channelId } = useParams({ from: CanalRoute.id });
  const { language } = usePreferences();
  const navigate = useNavigate();
  const kind = channelId as ChannelKind;
  const [composerText, setComposerText] = useState("");
  const [sending, setSending] = useState(false);

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ["messages", "channel", channelId],
    queryFn: () => fetchChannelMessages(channelId),
    staleTime: 10_000,
  });

  const accent = ACCENT[kind] ?? undefined;

  async function findConversationId(): Promise<string | null> {
    const base = supabaseRestBase();
    const headers = supabaseAuthHeaders();
    if (!base || !headers) return null;
    const url = `${base}/conversations?select=${enc("id,contact_id,primary_channel")}` +
      `&primary_channel=eq.${enc(channelId)}&limit=1`;
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) return null;
      const rows = (await res.json()) as Array<{ id: string; contact_id: string | null }>;
      const row = rows[0];
      return row?.contact_id ? row.id : null;
    } catch {
      return null;
    }
  }

  async function handleSend() {
    const text = composerText.trim();
    if (!text || sending) return;
    setSending(true);
    const base = supabaseRestBase();
    const headers = supabaseAuthHeaders();
    const conversationId = await findConversationId();
    if (base && headers && conversationId) {
      const body = {
        conversation_id: conversationId,
        sender_type: "agent",
        sender_id: "",
        content: text,
        message_type: "text",
      };
      try {
        const res = await fetch(`${base}/messages`, {
          method: "POST",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          setComposerText("");
          void refetchMessages();
        }
      } catch {
        // Silencio: no mock data (N5).
      }
    }
    setSending(false);
  }

  const chatMsgs: readonly ChatMsg[] = (messages ?? []).map<ChatMsg>((m) => ({
    id: m.id,
    senderType: m.senderType,
    content: m.content,
    createdAt: m.createdAt,
    status: m.senderType === "contact" ? "read" : "delivered",
  }));

  return (
    <div className="flex flex-col h-full rounded-2xl glass-card" data-channel-view>
      {/* Cabecera estilo app de mensajeria */}
      <div className="flex items-center justify-between gap-3 border-b border-border/30 p-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => void navigate({ to: "/channels" })}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Button>
          <span className="text-primary">
            <ChannelIcon kind={kind} className="size-8" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t(language, "canal." + kind)}
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-success shadow-[0_0_6px] shadow-success/60" />
              {t(language, "common.loading").replace("…", "")} {/* "en linea" usando t existente */}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </Button>
      </div>

      {/* Chat */}
      {chatMsgs.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-sm text-muted-foreground">
          {t(language, "chat.empty")}
        </div>
      ) : (
        <ChatThread messages={chatMsgs} lang={language} accentColor={accent} />
      )}

      {/* Composer */}
      <div className="border-t border-border/30 p-3 flex gap-2">
        <textarea
          data-chat-input
          className="flex-1 rounded-xl border border-border/55 bg-card-soft px-3 py-2 text-sm text-foreground resize-none"
          rows={2}
          placeholder={t(language, "chat.placeholder")}
          value={composerText}
          onChange={(e) => setComposerText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
        />
        <Button
          data-chat-send
          variant="primary"
          size="sm"
          disabled={!composerText.trim() || sending}
          onClick={() => void handleSend()}
        >
          {t(language, "chat.send")}
        </Button>
      </div>
    </div>
  );
}