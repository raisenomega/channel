/**
 * HUB by Raisen — Pagina de Automatizaciones (/automation).
 * Barrel/router: define la ruta y re-exporta el componente desde submódulos.
 */
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { AutomationPage } from "./automation/automation-page";

export const AutomationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/automation",
  component: AutomationPage,
});