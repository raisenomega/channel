/**
 * HUB by Raisen — Fetcher de /templates (Hotfix L-3).
 * L-3: config_incompleta NO redirige. La pagina sigue en /templates, muestra
 * los tabs y una lista vacia honesta + banner con CTA (needTenant).
 * Solo no_autorizado (sesion caida) delega al helper -> /login.
 * C4 <=75.
 */
import { useQuery } from "@tanstack/react-query";
import { handleFetcherError } from "@/lib/redirect-on-error";
import { readLocalSession } from "@/lib/auth";
import { listarTemplates } from "@/lib/templates-client/functions";
import type { WhatsAppTemplate } from "@/lib/templates-client/types";

export interface TemplatesVista {
  templates: WhatsAppTemplate[];
  syncFailed: boolean;
  needTenant: boolean;
  fallo: boolean;
}

export function useTemplates() {
  return useQuery<TemplatesVista>({
    queryKey: ["templates"],
    queryFn: async () => {
      const r = await listarTemplates();
      if (!r.ok) {
        // M-13: solo /login si NO hay sesion. Con sesion valida, un 401 del backend
        // (D-43) NO expulsa: se renderizan los tabs + banner honesto (como L-3).
        if (r.error.kind === "no_autorizado" && readLocalSession() === null) {
          handleFetcherError("no_autorizado");
        }
        return {
          templates: [],
          syncFailed: false,
          needTenant: r.error.kind === "config_incompleta",
          fallo: r.error.kind !== "config_incompleta",
        };
      }
      return { ...r.value, needTenant: false, fallo: false };
    },
    staleTime: 10_000,
  });
}
