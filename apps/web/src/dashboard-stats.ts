/**
 * HUB by Raisen — Stats y constantes del panel dashboard.
 */
import type { InboxItem } from "./types.ts";

export const CANALES: readonly string[] = ["whatsapp", "email", "instagram", "facebook", "telegram", "sms", "x", "linkedin", "webchat"];

export interface DashboardStats {
  readonly total: number;
  readonly porCanal: Readonly<Record<string, number>>;
  readonly sinAsignar: number;
  readonly abiertas: number;
  readonly hasChannelsConnected: boolean;
}

export function calcularStats(items: readonly InboxItem[]): DashboardStats {
  const porCanal: Record<string, number> = {};
  let sinAsignar = 0;
  let abiertas = 0;
  for (const it of items) {
    porCanal[it.channel] = (porCanal[it.channel] ?? 0) + 1;
    if (!it.assignedTo) sinAsignar += 1;
    if (it.status === "open") abiertas += 1;
  }
  return {
    total: items.length,
    porCanal,
    sinAsignar,
    abiertas,
    hasChannelsConnected: items.length > 0,
  };
}

export const COLOR_ESTADO: Readonly<Record<string, string>> = {
  open: "sev-success",
  pending: "sev-medium",
  snoozed: "sev-low",
  resolved: "sev-process",
};

export const ESTADOS: readonly string[] = ["open", "pending", "snoozed", "resolved"];