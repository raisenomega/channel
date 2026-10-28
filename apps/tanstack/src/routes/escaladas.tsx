/**
 * HUB by Raisen — Ruta /escaladas: tickets de escalada a humano.
 */
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { EscaladasPage } from "./escaladas/escaladas-page";

export const EscaladasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/escaladas",
  component: EscaladasPage,
});
