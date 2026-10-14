/**
 * HUB by Raisen — Pagina de Ordenes (/orders).
 * Barrel/router: define la ruta y re-exporta el componente desde submódulos.
 */
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { OrdersPage } from "./orders/orders-page";

export const OrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  component: OrdersPage,
});