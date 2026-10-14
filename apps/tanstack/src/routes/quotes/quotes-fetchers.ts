/**
 * HUB by Raisen — Hooks de datos para Cotizaciones.
 */
import { useQuery } from "@tanstack/react-query";
import { listarQuotes } from "@/lib/quotes-client";
import { listarContactos } from "@/lib/contacts-client";

export function useQuotesData() {
  const { data: quotes, isPending, refetch } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const r = await listarQuotes();
      return r.ok ? r.value : [];
    },
    staleTime: 30_000,
  });

  const { data: contacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const r = await listarContactos();
      return r.ok ? r.value : [];
    },
    staleTime: 60_000,
  });

  return { quotes, isPending, contacts, refetch };
}