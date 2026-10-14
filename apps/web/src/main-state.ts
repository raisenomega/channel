/**
 * HUB by Raisen — Estado compartido del bootstrap (raíz y app activa).
 */
import type { HUBApp } from "./app.ts";

export let raizActual: HTMLElement | null = null;
export let appActual: HUBApp | null = null;

export function registrarVista(root: HTMLElement, app: HUBApp): void {
  raizActual = root;
  appActual = app;
}