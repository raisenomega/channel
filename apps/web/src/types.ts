export interface PageState {
  readonly currentTab: TabId;
  readonly subStack: readonly SubPage[];
  readonly mode: OperationMode;
  readonly theme: "light" | "dark";
  readonly language: "es" | "en";
  readonly whiteLabel: boolean;
}

export type TabId =
  | "inbox" | "channels" | "agent" | "sales" | "contacts" | "settings";

export type OperationMode =
  | "lite" | "ecosystem" | "autonomous";

export interface SubPage {
  readonly title: string;
  readonly component: string;
  readonly params: Readonly<Record<string, unknown>>;
}

export type FilterType =
  | "channel" | "status" | "assigned" | "sla" | "tag" | "priority";

export interface InboxFilter {
  readonly type: FilterType;
  readonly value: string;
}

export interface InboxItem {
  readonly conversationId: string;
  readonly contactName: string;
  readonly channel: string;
  readonly lastMessage: string;
  readonly lastMessageAt: Date;
  readonly unreadCount: number;
  readonly status: string;
  readonly assignedTo: string | null;
  readonly slaViolated: boolean;
  readonly mode: "human" | "assistant" | "copilot" | "autonomous" | "escalated";
}