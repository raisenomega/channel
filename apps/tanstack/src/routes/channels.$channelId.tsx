/**
 * HUB by Raisen — Vista de canal individual.
 * Para WhatsApp: mockup Samsung S25 Ultra (wa-phone) + panel de conversacion.
 * Otros canales: chat nativo. Datos reales via Supabase REST (N5). Estilos aislados.
 */
import { useState, useMemo } from "react";
import { createRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import { ChannelIcon, type ChannelKind } from "@/components/ui/channel-icon";
import { Button } from "@/components/ui/button";
import type { Mensaje } from "@/lib/types";
import {
  samsungWhatsApp, WaSidePanel, WaContactBar, waChatFrom,
  type WaChat, type WaMsg, type WaContact,
} from "@/components/dashboard/whatsapp-phone";

export const CanalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/channels/$channelId",
  component: CanalViewPage,
});

const MESSAGE_COLS = ["id", "conversation_id", "sender_type", "sender_id", "content", "message_type", "created_at"];
const CONV_COLS = ["id", "contact_id", "primary_channel", "subject", "last_message_at"];
const CONTACT_COLS = ["id", "display_name", "primary_phone", "primary_email"];

function enc(v: string): string { return encodeURIComponent(v); }

async function fetchChannelConversations(channelId: string) {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const url = `${base}/conversations?select=${enc(CONV_COLS.join(","))}` +
    `&primary_channel=eq.${enc(channelId)}&order=last_message_at.desc&limit=50`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    return (await res.json()) as Array<{
      id: string; contact_id: string | null; primary_channel: string | null;
      subject: string | null; last_message_at: string | null;
    }>;
  } catch { return []; }
}

async function fetchMessagesForConversation(conversationId: string): Promise<Mensaje[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const url = `${base}/messages?select=${enc(MESSAGE_COLS.join(","))}` +
    `&conversation_id=eq.${enc(conversationId)}&order=created_at.asc&limit=200`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const filas = (await res.json()) as Array<{
      id: string; conversation_id: string; sender_type: string;
      sender_id: string | null; content: string; message_type: string; created_at: string;
    }>;
    return filas.map((r) => ({
      id: String(r.id), conversationId: String(r.conversation_id),
      senderType: String(r.sender_type) as Mensaje["senderType"],
      senderId: r.sender_id ? String(r.sender_id) : null,
      content: String(r.content), messageType: String(r.message_type ?? "text"),
      createdAt: r.created_at ?? new Date().toISOString(),
    }));
  } catch { return []; }
}

async function fetchContact(id: string) {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return null;
  const url = `${base}/contacts?id=eq.${enc(id)}&select=${enc(CONTACT_COLS.join(","))}&limit=1`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ id: string; display_name: string | null; primary_phone: string | null; primary_email: string | null }>;
    return rows[0] ?? null;
  } catch { return null; }
}

function toWaMsg(m: Mensaje): WaMsg {
  return {
    id: m.id,
    out: m.senderType === "agent",
    text: m.content,
    time: m.createdAt,
    status: m.senderType === "contact" ? "read" : "delivered",
  };
}

function CanalViewPage() {
  const { channelId } = useParams({ from: CanalRoute.id });
  const { language } = usePreferences();
  const navigate = useNavigate();
  const kind = channelId as ChannelKind;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [contactBarOpen, setContactBarOpen] = useState(false);

  const { data: conversations } = useQuery({
    queryKey: ["channel-convs", channelId],
    queryFn: () => fetchChannelConversations(channelId),
    staleTime: 20_000,
  });
  const { data: msgMap } = useQuery({
    queryKey: ["channel-msgs", channelId, activeId],
    queryFn: async () => {
      if (!activeId) return {} as Record<string, Mensaje[]>;
      const msgs = await fetchMessagesForConversation(activeId);
      return { [activeId]: msgs } as Record<string, Mensaje[]>;
    },
    enabled: !!activeId,
    staleTime: 10_000,
  });
  const { data: contactInfo } = useQuery({
    queryKey: ["channel-contact", activeId],
    queryFn: async () => {
      if (!activeId) return null;
      const conv = (conversations ?? []).find((c) => c.id === activeId);
      if (!conv?.contact_id) return null;
      return fetchContact(conv.contact_id);
    },
    enabled: !!activeId && !!conversations,
    staleTime: 60_000,
  });

  const chats: WaChat[] = useMemo(() => {
    return (conversations ?? []).map((c) => waChatFrom({
      conversationId: c.id,
      contactName: `Cliente ${channelId}`,
      lastMessage: c.subject ?? "",
      lastMessageAt: c.last_message_at ?? new Date().toISOString(),
      unreadCount: 0,
      channel: channelId,
    }));
  }, [conversations, channelId]);

  const activeChat = useMemo(() => chats.find((c) => c.id === activeId) ?? null, [chats, activeId]);
  const activeMsgs: WaMsg[] = useMemo(
    () => (activeId && msgMap?.[activeId] ? msgMap[activeId].map(toWaMsg) : []),
    [msgMap, activeId],
  );

  const activeContactName = contactInfo?.display_name ?? (activeChat?.name ?? "");
  const activeContact: WaContact = {
    name: activeContactName,
    phone: contactInfo?.primary_phone ?? "+1 (787) 555-0000",
    avatarColor: "#075e54",
    lastSeen: t(language, "common.loading").replace("…", "") === "" ? "en línea" : "en línea",
  };

  const messagesFor = (id: string) => (msgMap?.[id] ?? []).map(toWaMsg);

  const isWhatsApp = kind === "whatsapp";

  return (
    <div className="view">
      <div className="mb-3 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => void navigate({ to: "/channels" })}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Button>
        <span className="text-primary"><ChannelIcon kind={kind} className="size-6" /></span>
        <h2 className="text-lg font-bold text-foreground">{t(language, "canal." + kind)}</h2>
      </div>

      {isWhatsApp ? (
        <>
          <div className="wa-root">
            {samsungWhatsApp({
              chats,
              messagesByChat: (id) => messagesFor(id),
              contact: (id) => {
                const c = chats.find((x) => x.id === id);
                return c ? { name: c.name, phone: "+1 (787) 555-0000", avatarColor: c.color, lastSeen: "en línea" } : undefined;
              },
              onOpenContact: (id) => { setActiveId(id); setContactBarOpen(true); },
            })}
            <WaSidePanel
              active={!!activeChat}
              chat={activeChat}
              contact={activeContact}
              msgs={activeMsgs}
              onOpenContact={() => setContactBarOpen(true)}
            />
          </div>
          <WaContactBar
            open={contactBarOpen}
            contact={activeChat ? activeContact : null}
            onClose={() => setContactBarOpen(false)}
          />
        </>
      ) : (
        <div className="rounded-2xl glass-card p-4 text-sm text-muted-foreground">
          {t(language, "canal.realtime")} — {t(language, "canal." + kind)}
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {chats.length ? chats.map((c) => (
              <button key={c.id} className="chip" onClick={() => setActiveId(c.id)}>
                <span className="chip-name">{c.name}</span>
              </button>
            )) : <span>{t(language, "cache.empty")}</span>}
          </div>
        </div>
      )}
    </div>
  );
}