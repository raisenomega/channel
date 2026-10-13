/**
 * HUB by Raisen — Vigia: panel de observabilidad en vivo del frontend
 * Acumula eventos de logger, errores globales y muestras en pantalla.
 * Toggle: clic en el icono o el area del vigia.
 */
import { LogContext } from "@shared/infrastructure/logger.infrastructure.ts";
import { publicar } from "./telemetria-client.ts";

interface EventoVigia {
  readonly ts: string;
  readonly msg: string;
  readonly nivel: "debug" | "info" | "warn" | "error";
  readonly fase: string;
  readonly uid: string;
  readonly causa: string;
}

const MAX = 100;
const buffer: EventoVigia[] = [];
let visible = false;

function color(nivel: EventoVigia["nivel"]): string {
  return nivel === "error" ? "hsl(0,72%,64%)"
    : nivel === "warn" ? "hsl(45,90%,55%)"
    : nivel === "info" ? "hsl(205,85%,58%)"
    : "hsl(225,8%,55%)";
}

function push(nivel: EventoVigia["nivel"], msg: string, ctx: LogContext = {}): void {
  const uid = ctx.uid ?? alcanzarUid() ?? "";
  buffer.push({ ts: new Date().toISOString(), msg, nivel, uid, fase: ctx.fase ?? "", causa: ctx.causa ?? "" });
  if (buffer.length > MAX) buffer.shift();
  if (visible) renderVentana();
  void publicar({ nivel, mensaje: msg, ...(ctx.fase ? { fase: ctx.fase } : {}), ...(ctx.causa ? { causa: ctx.causa } : {}) });
}

function alcanzarUid(): string | undefined {
  try {
    const raw = localStorage.getItem("hub.session");
    if (!raw) return undefined;
    return (JSON.parse(raw) as { uid?: string }).uid;
  } catch {
    return undefined;
  }
}

function renderVentana(): void {
  const el = document.getElementById("vigia-window");
  if (!el) return;
  el.innerHTML = buffer.map((e) =>
    `<div style="padding:3px 6px;font:11px/1.3 ui-monospace;color:${color(e.nivel)}">
      <span>${e.ts.slice(11, 19)} [${e.nivel}] ${e.msg}</span>
      ${e.causa ? `<span style="color:hsl(40,8%,66%)"> (${e.causa})</span>` : ""}
    </div>`
  ).join("");
}

function toggleVigia(): void {
  visible = !visible;
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

function onError(event: Event): void {
  const e = event as ErrorEvent;
  push("error", e.message || "error_no_descrito");
}

function onRej(event: Event): void {
  const o = event as { reason?: unknown };
  const msg = o.reason instanceof Error ? o.reason.message : String(o.reason ?? "rej_desconocida");
  push("error", msg);
}

export function iniciarVigia(fase: string): void {
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRej);

  const origErr = console.error;
  const origWarn = console.warn;
  console.error = (...args: unknown[]) => { push("error", args.map(String).join(" ")); origErr(...args); };
  console.warn = (...args: unknown[]) => { push("warn", args.map(String).join(" ")); origWarn(...args); };

  const btn = document.createElement("div");
  btn.id = "vigia-toggle";
  btn.textContent = "v";
  btn.style.cssText = "position:fixed;bottom:12px;right:12px;z-index:9999;background:hsl(var(--primary)/0.85);color:hsl(var(--background));border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:800;font-size:12px;cursor:pointer";
  btn.onclick = toggleVigia;
  document.body?.appendChild(btn);
  void fase;
}