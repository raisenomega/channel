/**
 * HUB by Raisen — Hooks de datos para la vista de canal (queries + derivados). C4 <=75.
 * Mensajes del hilo activo: scroll infinito keyset (useInfiniteQuery) -> carga todo el historial.
 */
import { useState, useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { t, type Idioma } from "@/lib/i18n";
import type { Mensaje } from "@/lib/types";
import { waChatFrom, type WaChat, type WaMsg, type WaContact } from "@/components/dashboard/whatsapp-phone";
import type { ChannelMeta } from "./channel-meta";
import { fetchChannelConversations, fetchContact, type ActiveContactInfo } from "./channel-fetchers";
import { fetchMessagesPage, MSG_PAGE } from "./channel-msg-fetch";
import { toWaMsg } from "./channel-phone-app";
import { contactNameFor } from "./channel-amplified-chat";

export interface CanalData {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  chats: WaChat[];
  activeChat: WaChat | null;
  threadContactId: string | null;
  activeMsgs: WaMsg[];
  loadOlder: () => void;
  hasMore: boolean;
  loadingOlder: boolean;
  activeContact: WaContact;
  contactInfo: ActiveContactInfo | null;
}

export function useCanalData(channelId: string, lang: Idioma, meta: ChannelMeta): CanalData {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: conversations } = useQuery({ queryKey: ["channel-convs", channelId], queryFn: () => fetchChannelConversations(channelId), staleTime: 20_000 });
  const msgs = useInfiniteQuery({
    queryKey: ["channel-msgs", channelId, activeId],
    queryFn: ({ pageParam }) => (activeId ? fetchMessagesPage(activeId, pageParam) : Promise.resolve([] as Mensaje[])),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.length === MSG_PAGE ? last[last.length - 1]!.createdAt : undefined),
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
    contactName: (Array.isArray(c.contacts) ? c.contacts[0]?.display_name : c.contacts?.display_name) || contactNameFor(c.contact_id), // Bug 1+#2: embed objeto O array
    lastMessage: c.subject ?? "",
    lastMessageAt: c.last_message_at ?? new Date().toISOString(),
    unreadCount: 0,
    channel: channelId,
  })), [conversations, channelId]);

  const activeChat = useMemo(() => chats.find((c) => c.id === activeId) ?? null, [chats, activeId]);
  const threadContactId = useMemo(() => (activeId ? (conversations ?? []).find((c) => c.id === activeId)?.contact_id ?? null : null), [conversations, activeId]);
  // páginas DESC (nuevos->viejos) -> aplanar y revertir a cronológico (viejos arriba, nuevos abajo)
  const activeMsgs: WaMsg[] = useMemo(() => [...(msgs.data?.pages.flat() ?? [])].reverse().map(toWaMsg), [msgs.data]);
  const activeContact: WaContact = {
    name: contactInfo?.display_name ?? activeChat?.name ?? "", phone: contactInfo?.primary_phone ?? "",
    avatarColor: meta.hex, lastSeen: t(lang, "canal.enLinea"),
  };

  return {
    activeId, setActiveId, chats, activeChat, threadContactId, activeMsgs,
    loadOlder: () => { if (msgs.hasNextPage && !msgs.isFetchingNextPage) void msgs.fetchNextPage(); },
    hasMore: !!msgs.hasNextPage, loadingOlder: msgs.isFetchingNextPage,
    activeContact, contactInfo: contactInfo ?? null,
  };
}
