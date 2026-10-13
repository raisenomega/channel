import { lucide } from "../../../src/shared/domain/lucide-icons.ts";
import type { InboxItem, InboxFilter } from "./types.ts";

export function renderInboxList(items: InboxItem[], filters: InboxFilter[]): string {
  const filtrados = items.filter((item) => {
    return filters.length === 0 || filters.every((f) => {
      switch (f.type) {
        case "channel": return item.channel === f.value;
        case "status": return item.status === f.value;
        case "assigned": return f.value === "unassigned" ? !item.assignedTo : item.assignedTo === f.value;
        case "sla": return f.value === "violated" ? item.slaViolated : true;
        default: return true;
      }
    });
  });
  return filtrados.map(renderItem).join("");
}

export function renderFilterChips(filters: InboxFilter[], allChannels: string[]): string {
  const channelChips = allChannels.map((ch) =>
    `<div class="chip flex items-center gap-sm" onclick="toggleFilter('channel','${ch}')">
      ${lucide(ch === "whatsapp" ? "phone" : ch === "email" ? "mail" : "message-square", { size: 16 })}
      <span class="chip-name text-sm">${ch}</span>
    </div>`
  ).join("");
  return `<div class="chips">${channelChips}</div>`;
}

function renderItem(item: InboxItem): string {
  const modeIcon = item.mode === "autonomous" ? "agent" : item.mode === "human" ? "contacts" : "inbox";
  const slaBadge = item.slaViolated ? `<span class="badge badge-danger text-xs">SLA</span>` : "";
  return `<div class="list-item flex items-center gap p-sm px-lg" onclick="openConversation('${item.conversationId}')">
    <div class="avatar" style="background:var(--hub-deep)">${item.contactName[0].toUpperCase()}
      <span class="channel-badge" style="background:var(--hub)">${lucide(modeIcon, { size: 12 })}</span>
    </div>
    <div class="body flex-1 min-width-0">
      <div class="h flex items-center gap-sm">
        <span class="nm text-base font-bold truncate">${item.contactName}</span>
        ${slaBadge}
        <span class="tm text-xs text-dim ml-auto">${formatTime(item.lastMessageAt)}</span>
      </div>
      <div class="msg text-sm text-muted line-clamp-2">${item.lastMessage}</div>
    </div>
    ${item.unreadCount > 0 ? `<span class="badge badge-hub">${item.unreadCount}</span>` : ""}
  </div>`;
}

function formatTime(d: Date): string {
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return "ahora";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return d.toLocaleDateString();
}