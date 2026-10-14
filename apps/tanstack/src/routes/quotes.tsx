/**
 * HUB by Raisen — Pagina de Cotizaciones (/quotes).
 * Barrel/router: define la ruta y re-exporta el componente desde submódulos.
 */
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { QuotesPage } from "./quotes/quotes-page";

export const QuotesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/quotes",
  component: QuotesPage,
});