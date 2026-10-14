import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./app/route-tree";
import NotFoundPage from "./app/not-found";

const router = createRouter({ routeTree, defaultNotFoundComponent: NotFoundPage, scrollRestoration: true });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/** Entry router que vinxi/TanStack Start localiza en src/router.ts. */
export default router;