/**
 * HUB by Raisen — Mappers y fetch del dashboard /inbox.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";
import type { InboxItem, DashboardStats, RowConv } from "@/lib/types";

export const CANALES: readonly string[] = ["whatsapp", "email", "instagram", "facebook", "telegram", "sms", "x", "linkedin", "webchat"];

export const ESTADOS: readonly string[] = ["open", "pending", "snoozed", "resolved"];

export function calcularStats(items: readonly InboxItem[]): DashboardStats {
  const porCanal: Record<string, number> = {};
  let sinAsignar = 0;
  let abiertas = 0;
  for (const it of items) {
    porCanal[it.channel] = (porCanal[it.channel] ?? 0) + 1;
    if (!it.assignedTo) sinAsignar += 1;
    if (it.status === "open") abiertas += 1;
  }
  return { total: items.length, porCanal, sinAsignar, abiertas, hasChannelsConnected: items.length > 0 };
}

function mapearModo(m: string | null): InboxItem["mode"] {
  const v = String(m ?? "human");
  if (v === "assistant" || v === "copilot" || v === "autonomous" || v === "escalated" || v === "human") return v;
  return "human";
}

function desdeRow(r: RowConv): InboxItem {
  const contactId = r.contact_id ? String(r.contact_id) : null;
  const contactName = contactId && contactId.length > 8 ? "Contacto" : (contactId ?? "Contacto");
  return {
    conversationId: String(r.id),
    contactId,
    contactName,
    channel: String(r.primary_channel ?? "whatsapp"),
    lastMessage: String(r.subject ?? "Conversacion"),
    lastMessageAt: r.last_message_at ?? new Date().toISOString(),
    unreadCount: 0,
    status: String(r.status ?? "open"),
    assignedTo: r.assigned_agent_id ? "Asignado" : null,
    slaViolated: r.sla_violated === true,
    mode: mapearModo(r.operation_mode),
  };
}

export async function fetchInbox(): Promise<InboxItem[]> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return [];
  const cols = ["id", "contact_id", "status", "operation_mode", "primary_channel", "last_message_at", "assigned_agent_id", "sla_violated", "total_messages", "subject"];
  const url = `${base}/conversations?select=${encodeURIComponent(cols.join(","))}&order=last_message_at.desc&limit=50`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const filas = (await res.json()) as RowConv[];
    return filas.map(desdeRow);
  } catch {
    return [];
  }
}

export function formatTime(iso: string, lang: Idioma): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return t(lang, "inbox.justNow");
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}${t(lang, "inbox.min")}`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}${t(lang, "inbox.hour")}`;
  return d.toLocaleDateString(lang === "es" ? "es" : "en", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}