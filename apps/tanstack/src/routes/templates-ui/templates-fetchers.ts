/**
 * HUB by Raisen — Fetcher de /templates (Hotfix L-3).
 * L-3: config_incompleta NO redirige. La pagina sigue en /templates, muestra
 * los tabs y una lista vacia honesta + banner con CTA (needTenant).
 * Solo no_autorizado (sesion caida) delega al helper -> /login.
 * C4 <=75.
 */
import { useQuery } from "@tanstack/react-query";
import { handleFetcherError } from "@/lib/redirect-on-error";
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
        if (r.error.kind === "no_autorizado") {
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
