/**
 * HUB by Raisen — Acciones y render del Vigia.
 */
import { LogContext } from "@shared/infrastructure/logger.infrastructure.ts";
import { publicar } from "./telemetria-client.ts";
import { buffer, MAX, visible, setVisible, ctxUid, color, type EventoVigia } from "./vigia-state.ts";

export function push(nivel: EventoVigia["nivel"], msg: string, ctx: LogContext = {}): void {
  const uid = ctxUid(ctx);
  buffer.push({ ts: new Date().toISOString(), msg, nivel, uid, fase: ctx.fase ?? "", causa: ctx.causa ?? "" });
  if (buffer.length > MAX) buffer.shift();
  if (visible) renderVentana();
  void publicar({ nivel, mensaje: msg, ...(ctx.fase ? { fase: ctx.fase } : {}), ...(ctx.causa ? { causa: ctx.causa } : {}) });
}

export function renderVentana(): void {
  const el = document.getElementById("vigia-window");
  if (!el) return;
  el.innerHTML = buffer.map((e) =>
    `<div style="padding:3px 6px;font:11px/1.3 ui-monospace;color:${color(e.nivel)}">
      <span>${e.ts.slice(11, 19)} [${e.nivel}] ${e.msg}</span>
      ${e.causa ? `<span style="color:hsl(40,8%,66%)"> (${e.causa})</span>` : ""}
    </div>`
  ).join("");
}

export function toggleVigia(): void {
  setVisible(!visible);
  const root = document.getElementById("app") ?? document.body;
  let w = root.querySelector("#vigia-window") as HTMLDivElement | null;
  if (!w) {
    w = document.createElement("div");
    w.id = "vigia-window";
    w.style.cssText = "position:fixed;top:0;left:0;right:0;height:40dvh;overflow:auto;background:hsl(var(--card)/0.95);z-index:9999;border-bottom:1px solid hsl(var(--border)/0.4);display:none";
    root.appendChild(w);
  }
  w.style.display = visible ? "block" : "none";
  if (visible) renderVentana();
}

export function onError(event: Event): void {
  const e = event as ErrorEvent;
  push("error", e.message || "error_no_descrito");
}

export function onRej(event: Event): void {
  const o = event as { reason?: unknown };
  const msg = o.reason instanceof Error ? o.reason.message : String(o.reason ?? "rej_desconocida");
  push("error", msg);
}