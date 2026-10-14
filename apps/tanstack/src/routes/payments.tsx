/**
 * HUB by Raisen — Pagina de Pagos (/payments).
 * Barrel/router: define la ruta y re-exporta el componente desde submódulos.
 */
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { PaymentsPage } from "./payments/payments-page";

export const PaymentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payments",
  component: PaymentsPage,
});