/**
 * HUB by Raisen — Tipos y heimers de formato para el mockup de WhatsApp.
 */

export interface WaChat {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  color: string;
  me?: boolean;
}

export interface WaMsg {
  id: string;
  out: boolean;
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
}

export interface WaContact {
  name: string;
  phone: string;
  avatarColor: string;
  lastSeen: string;
}

const AVATARS = ["#075e54", "#128c7e", "#1f8a52", "#0a7ea4", "#7c3aed", "#c92a2a", "#0b7285", "#7048e8"];

export function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATARS[h % AVATARS.length] ?? "#075e54";
}

export function initials(name: string): string {
  return name.trim().split(" ").filter(Boolean).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

export function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date(); y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === y.toDateString()) return "Ayer";
  return d.toLocaleDateString("es", { day: "2-digit", month: "2-digit" });
}