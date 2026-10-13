import { createRoute, redirect } from "@tanstack/react-router";
import { rootRoute } from "@/app/root";
import { readLocalSession } from "@/lib/auth";

export const IndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    const session = readLocalSession();
    throw redirect({ to: session ? "/inbox" : "/login" });
  },
});