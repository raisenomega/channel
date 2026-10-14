import { useQuery } from "@tanstack/react-query";
import { listarSlaPolicies, listarBusinessHours } from "@/lib/sla-client";
import type { SlaPolicyItem, BusinessHoursItem } from "@/lib/sla-client";

export function useSlaPolicies() {
  return useQuery({
    queryKey: ["sla-policies"],
    queryFn: async () => {
      const r = await listarSlaPolicies();
      return r.ok ? r.value : [];
    },
    staleTime: 30_000,
  });
}

export function useBusinessHours() {
  return useQuery({
    queryKey: ["sla-hours"],
    queryFn: async () => {
      const r = await listarBusinessHours();
      return r.ok ? r.value : [];
    },
    staleTime: 30_000,
  });
}

export type { SlaPolicyItem, BusinessHoursItem };