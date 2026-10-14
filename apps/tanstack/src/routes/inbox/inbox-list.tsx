/**
 * HUB by Raisen — Lista de conversaciones del dashboard /inbox.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { InboxItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { BentoTitle } from "@/components/dashboard/bentobox-dashboard";
import { formatTime } from "./inbox-mappers";
import { IconList } from "./inbox-icons";

export function ConversationList({ language, items, onOpen, onGoChannels }: {
  language: Idioma;
  items: readonly InboxItem[];
  onOpen: (id: string) => void;
  onGoChannels: () => void;
}) {
  const sinDatos = items.length === 0;
  return (
    <div className="bento mt-4">
      <div className="bento-card bento-col-12">
        <BentoTitle icon={<IconList />} label={t(language, "dash.conversaciones")} right={<Badge tone="hub">{String(items.length)}</Badge>} />
        {sinDatos ? (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
            <div className="text-lg font-semibold text-foreground">{t(language, "dash.emptyTitle")}</div>
            <p className="text-sm text-muted-foreground">{t(language, "dash.emptyBody")}</p>
            <Badge tone="hub" className="cursor-pointer" onClick={onGoChannels}>{t(language, "dash.emptyAction")}</Badge>
          </div>
        ) : (
          <div className="grid gap-2">
            {items.map((item) => (
              <div key={item.conversationId} className="flex items-center gap-2 rounded-2xl border border-border/30 bg-card-soft/40 p-2.5 hover:border-primary/50" onClick={() => onOpen(item.conversationId)}>
                <Avatar name={item.contactName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-foreground">{item.contactName}</span>
                    {item.slaViolated ? <Badge tone="danger">SLA</Badge> : null}
                    <span className="ml-auto text-xs text-dim">{formatTime(item.lastMessageAt, language)}</span>
                  </div>
                  <div className="truncate text-sm text-muted-foreground">{item.lastMessage}</div>
                </div>
                {item.unreadCount > 0 ? <Badge tone="hub">{String(item.unreadCount)}</Badge> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}