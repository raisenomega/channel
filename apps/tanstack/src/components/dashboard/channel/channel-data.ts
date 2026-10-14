/**
 * HUB by Raisen — Hooks de datos para la vista de canal (queries + derivados). C4 ≤75.
 */
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { t, type Idioma } from "@/lib/i18n";
import type { Mensaje } from "@/lib/types";
import { waChatFrom, type WaChat, type WaMsg, type WaContact } from "@/components/dashboard/whatsapp-phone";
import type { ChannelMeta } from "./channel-meta";
import { fetchChannelConversations, fetchMessagesForConversation, fetchContact, type ActiveContactInfo } from "./channel-fetchers";
import { toWaMsg } from "./channel-phone-app";
import { contactNameFor } from "./channel-amplified-chat";

export interface CanalData {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  chats: WaChat[];
  activeChat: WaChat | null;
  threadContactId: string | null;
  activeMsgs: WaMsg[];
  activeContact: WaContact;
  contactInfo: ActiveContactInfo | null;
}

export function useCanalData(channelId: string, lang: Idioma, meta: ChannelMeta): CanalData {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: conversations } = useQuery({ queryKey: ["channel-convs", channelId], queryFn: () => fetchChannelConversations(channelId), staleTime: 20_000 });
  const { data: msgMap } = useQuery({
    queryKey: ["channel-msgs", channelId, activeId],
    queryFn: async () => {
      if (!activeId) return {} as Record<string, Mensaje[]>;
      const msgs = await fetchMessagesForConversation(activeId);
      return { [activeId]: msgs } as Record<string, Mensaje[]>;
    },
    enabled: !!activeId, staleTime: 10_000,
  });
  const { data: contactInfo } = useQuery({
    queryKey: ["channel-contact", activeId],
    queryFn: async () => {
      if (!activeId) return null;
      const conv = (conversations ?? []).find((c) => c.id === activeId);
      return conv?.contact_id ? fetchContact(conv.contact_id) : null;
    },
    enabled: !!activeId && !!conversations, staleTime: 60_000,
  });

  const chats: WaChat[] = useMemo(() => (conversations ?? []).map((c) => waChatFrom({
    conversationId: c.id,
    contactName: contactNameFor(c.contact_id),
    lastMessage: c.subject ?? "",
    lastMessageAt: c.last_message_at ?? new Date().toISOString(),
    unreadCount: 0,
    channel: channelId,
  })), [conversations, channelId]);

  const activeChat = useMemo(() => chats.find((c) => c.id === activeId) ?? null, [chats, activeId]);
  const threadContactId = useMemo(() => {
    if (!activeId) return null;
    return (conversations ?? []).find((c) => c.id === activeId)?.contact_id ?? null;
  }, [conversations, activeId]);
  const activeMsgs: WaMsg[] = useMemo(() => (activeId && msgMap?.[activeId] ? msgMap[activeId].map(toWaMsg) : []), [msgMap, activeId]);
  const activeContact: WaContact = {
    name: contactInfo?.display_name ?? activeChat?.name ?? "",
    phone: contactInfo?.primary_phone ?? "",
    avatarColor: meta.hex,
    lastSeen: t(lang, "canal.enLinea"),
  };

  return { activeId, setActiveId, chats, activeChat, threadContactId, activeMsgs, activeContact, contactInfo: contactInfo ?? null };
}