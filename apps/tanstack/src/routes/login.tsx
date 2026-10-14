/**
 * HUB by Raisen — Pagina de Login (/login).
 * Barrel/router: define la ruta y re-exporta el componente desde submódulos.
 */
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { LoginPage } from "./login/login-page";

export const LoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});