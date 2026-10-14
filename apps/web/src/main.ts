/**
 * HUB by Raisen — bootstrap (entrada de la app).
 * Flujo y render en submódulos (C4 ≤75).
 */
import "./styles/index.css";
import { inicializarHUB } from "./main-app.ts";

if (typeof document !== "undefined") {
  const el = document.getElementById("app");
  if (el) void inicializarHUB(el as HTMLElement);
}