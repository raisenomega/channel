import { useQuery } from "@tanstack/react-query";
import { listarContactos } from "@/lib/contacts-client";

export function useContactos() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const r = await listarContactos();
      return r.ok ? r.value : [];
    },
    staleTime: 30_000,
  });
}