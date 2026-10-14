/**
 * HUB by Raisen — Estado y utilidades del Vigia.
 */
import { LogContext } from "@shared/infrastructure/logger.infrastructure.ts";

export interface EventoVigia {
  readonly ts: string;
  readonly msg: string;
  readonly nivel: "debug" | "info" | "warn" | "error";
  readonly fase: string;
  readonly uid: string;
  readonly causa: string;
}

export const MAX = 100;
export const buffer: EventoVigia[] = [];
export let visible = false;

export function setVisible(v: boolean): void {
  visible = v;
}

export function color(nivel: EventoVigia["nivel"]): string {
  return nivel === "error" ? "hsl(0,72%,64%)"
    : nivel === "warn" ? "hsl(45,90%,55%)"
    : nivel === "info" ? "hsl(205,85%,58%)"
    : "hsl(225,8%,55%)";
}

export function alcanzarUid(): string | undefined {
  try {
    const raw = localStorage.getItem("hub.session");
    if (!raw) return undefined;
    return (JSON.parse(raw) as { uid?: string }).uid;
  } catch {
    return undefined;
  }
}

export function ctxUid(ctx: LogContext): string {
  return ctx.uid ?? alcanzarUid() ?? "";
}