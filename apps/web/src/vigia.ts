/**
 * HUB by Raisen — Vigia: panel de observabilidad en vivo del frontend.
 * Estado y acciones en submódulos (C4 ≤75).
 */
import { push, toggleVigia, onError, onRej } from "./vigia-acciones.ts";

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