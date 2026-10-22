/**
 * HUB by Raisen — Utilidades de fecha de la Agenda (mes + grid 6x7 + semana/dia).
 */
import type { Idioma } from "@/lib/i18n";

const LOCALE = (lang: Idioma): string => (lang === "es" ? "es-ES" : "en-US");
const pad = (n: number): string => String(n).padStart(2, "0");

/** Rango ISO del grid (6 semanas desde el domingo previo al dia 1) + inicio del grid. */
export function monthRange(year: number, month: number): { from: string; to: string; gridStart: Date } {
  const first = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - first.getDay()); // retrocede al domingo
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridEnd.getDate() + 42);
  return { from: gridStart.toISOString(), to: gridEnd.toISOString(), gridStart };
}

export function monthLabel(lang: Idioma, year: number, month: number): string {
  return new Intl.DateTimeFormat(LOCALE(lang), { month: "long", year: "numeric" }).format(new Date(year, month, 1));
}

export function weekdayShort(lang: Idioma): string[] {
  const fmt = new Intl.DateTimeFormat(LOCALE(lang), { weekday: "short" });
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2023, 0, 1 + i))); // 2023-01-01 = domingo
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function dayKey(d: Date): string { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
export function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function startOfWeek(d: Date): Date { return addDays(d, -d.getDay()); } // domingo

export function timeLabel(lang: Idioma, iso: string): string {
  return new Intl.DateTimeFormat(LOCALE(lang), { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
export function fullDate(lang: Idioma, iso: string): string {
  return new Intl.DateTimeFormat(LOCALE(lang), { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
export function dayLabel(lang: Idioma, d: Date): string {
  return new Intl.DateTimeFormat(LOCALE(lang), { weekday: "long", day: "numeric", month: "long" }).format(d);
}
export function weekdayDayLabel(lang: Idioma, d: Date): string {
  return new Intl.DateTimeFormat(LOCALE(lang), { weekday: "short", day: "numeric" }).format(d);
}
