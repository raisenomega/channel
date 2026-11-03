/**
 * HUB by Raisen — Pagina de Facturas (/invoices).
 * Barrel/router: define la ruta y re-exporta el componente desde submodulos. Espejo de /quotes.
 */
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { InvoicesPage } from "./invoices/invoices-page";

export const InvoicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invoices",
  component: InvoicesPage,
});
