/**
 * HUB by Raisen — Vista de canal individual (submódulos bajo components/dashboard/channel; C4 ≤75 líneas).
 */
import { useEffect, useState } from "react";
import { createRoute, useParams } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { type ChannelKind } from "@/components/ui/channel-icon";
import { WaContactBar } from "@/components/dashboard/whatsapp-phone";
import { ChannelFrame, type ChannelTab } from "@/components/dashboard/channel-frame";
import { BrandPhone } from "@/components/dashboard/brand-phone";
import { CHANNEL_META } from "@/components/dashboard/channel/channel-meta";
import { ChannelBar } from "@/components/dashboard/channel/channel-bar";
import { useCanalData } from "@/components/dashboard/channel/channel-data";
import { useChannelSend } from "@/components/dashboard/channel/channel-send";
import { PhoneApp } from "@/components/dashboard/channel/channel-phone-app";
import { TabContent } from "@/components/dashboard/channel/channel-tab-content";
import { AmplifiedChat } from "@/components/dashboard/channel/channel-amplified-chat";
import { useMarkRead } from "@/lib/alerts/alerts-context";

export const CanalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/channels/$channelId",
  component: CanalViewPage,
});

function CanalViewPage() {
  const { channelId } = useParams({ from: CanalRoute.id });
  const markRead = useMarkRead();
  useEffect(() => { markRead("channel:" + channelId); }, [channelId, markRead]);
  const { language } = usePreferences();
  const kind = channelId as ChannelKind;
  const meta = CHANNEL_META[kind] ?? CHANNEL_META.webchat;
  const { activeId, setActiveId, chats, activeChat, threadContactId, activeMsgs, loadOlder, hasMore, loadingOlder, activeContact, contactInfo } =
    useCanalData(channelId, language, meta);

  const [contactBarOpen, setContactBarOpen] = useState(false);
  const [composer, setComposer] = useState("");
  const [activeTab, setActiveTab] = useState<ChannelTab | undefined>(undefined);

  const { send, pending } = useChannelSend(channelId, activeId, threadContactId);
  const onSelect = (id: string) => { setActiveId(id || null); setActiveTab(undefined); }; // clic en hilo -> abre la conversacion (sale del chip activo)
  const onSend = () => { send(composer); setComposer(""); };
  const msgs = [...activeMsgs, ...pending];
  const openContact = () => setContactBarOpen(true);

  return (
    <div className="channel-view">
      <ChannelBar lang={language} kind={kind} to="/channels/$channelId" />
      <ChannelFrame
        lang={language}
        accent={meta.hsl}
        active={activeTab}
        onTabChange={setActiveTab}
        composerValue={composer}
        onComposerChange={setComposer}
        onSend={onSend}
        composerContent={
          activeTab
            ? <TabContent lang={language} activeTab={activeTab} accent={meta.hsl} contactId={threadContactId} contactInfo={contactInfo} />
            : <AmplifiedChat lang={language} chat={activeChat} contact={activeContact} msgs={msgs} meta={meta} onOpenContact={openContact} onLoadOlder={loadOlder} hasMore={hasMore} loadingOlder={loadingOlder} />
        }
      >
        <BrandPhone kind={meta.brand}>
          <PhoneApp lang={language} meta={meta} chats={chats} activeId={activeId} onSelect={onSelect} />
        </BrandPhone>
      </ChannelFrame>
      <WaContactBar open={contactBarOpen} contact={activeChat ? activeContact : null} onClose={() => setContactBarOpen(false)} />
    </div>
  );
}