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
  readonly contactId: string | null;
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

export interface AppContext {
  readonly uid: string;
  readonly email: string;
  readonly tenantId: string;
  readonly tenantName: string;
  readonly tenantPlan: string;
}

export type AutonomyPhase = 0 | 1 | 2 | 3 | 4;

export interface SafeProgresion {
  readonly currentPhase: AutonomyPhase;
  readonly isKillSwitched: boolean;
  readonly killSwitchReason: string | null;
}

/** Snapshot real de gobernanza SAFE (safe_evaluations + autonomy_progression). */
export interface SafeSnapshot {
  readonly totalEvaluaciones: number;
  readonly disagreementPromedioPct: number | null;
  readonly decisiones: {
    readonly approved: number;
    readonly blocked: number;
    readonly abstained: number;
  };
  readonly progresion: SafeProgresion | null;
}