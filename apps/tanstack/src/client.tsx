import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PreferencesProvider } from "./app/preferences";
import { AlertsProvider } from "./lib/alerts/alerts-provider";
import router from "./router";
import "./styles/index.css";

const queryClient = new QueryClient();

function Shell() {
  return (
    <PreferencesProvider>
      <QueryClientProvider client={queryClient}>
        <AlertsProvider>
          <RouterProvider router={router} />
        </AlertsProvider>
      </QueryClientProvider>
    </PreferencesProvider>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <Shell />
    </StrictMode>,
  );
}