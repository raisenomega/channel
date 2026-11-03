/**
 * HUB by Raisen — Hooks de datos para Facturas (espejo de quotes-fetchers). Datos reales via RLS.
 */
import { useQuery } from "@tanstack/react-query";
import { listarInvoices } from "@/lib/invoices-client";
import { listarContactos } from "@/lib/contacts-client";

export function useInvoicesData() {
  const { data: invoices, isPending, refetch } = useQuery({
    queryKey: ["invoices"],
    queryFn: listarInvoices,
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

  return { invoices, isPending, contacts, refetch };
}
