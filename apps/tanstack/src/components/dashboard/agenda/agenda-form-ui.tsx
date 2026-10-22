/**
 * HUB by Raisen — Tipo del formulario de cita + helpers de UI (label + input). C4 <=75.
 */
import type { ReactNode } from "react";
import type { MediaItem } from "./agenda-types";

export interface ApptForm {
  title: string; date: string; time: string; status: string; channel: string; createdBy: string; meetingType: string;
  contactId: string; conversationId: string; agentId: string; quoteId: string; orderId: string; attachmentId: string;
  description: string; reason: string; preNotes: string; reminders: number[]; media: MediaItem[];
}

export const INP = "w-full rounded-lg border border-border/50 bg-background/40 px-2 py-1.5 text-sm text-foreground";

export function L({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs">
      <span className="mb-0.5 block text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
