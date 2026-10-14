/**
 * HUB by Raisen — Hooks de datos para Automatizaciones.
 */
import { useQuery } from "@tanstack/react-query";
import { listarReglas } from "@/lib/automation-client";

export function useAutomationData() {
  const { data, isPending, refetch } = useQuery({
    queryKey: ["automation"],
    queryFn: async () => {
      const r = await listarReglas();
      return r.ok ? r.value : [];
    },
    staleTime: 30_000,
  });

  return { rules: data, isPending, refetch };
}