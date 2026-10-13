/**
 * HUB by Raisen — Tipos compartidos para el hilo de chat.
 * Separado de chat-thread.ts para mantener cada archivo ≤75 líneas (C4).
 */
export interface Mensaje {
  readonly id: string;
  readonly conversationId: string;
  readonly senderType: "contact" | "agent" | "system";
  readonly senderId: string | null;
  readonly content: string;
  readonly messageType: string;
  readonly createdAt: Date;
}

export function formatoHora(d: Date, lang: "es" | "en"): string {
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return lang === "es" ? "ahora" : "now";
  if (diff < 3_600_000) {
    const m = Math.floor(diff / 60_000);
    return `${m}${lang === "es" ? "m" : "m"}`;
  }
  if (diff < 86_400_000) {
    const h = Math.floor(diff / 3_600_000);
    return `${h}${lang === "es" ? "h" : "h"}`;
  }
  return d.toLocaleDateString(lang === "es" ? "es" : "en", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export function esDelContacto(m: Mensaje): boolean {
  return m.senderType === "contact";
}