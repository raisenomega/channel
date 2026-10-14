import { useState, useMemo } from "react";
import type { ContactListItem } from "@/lib/contacts-client";

export function useContactsFilter(data: ContactListItem[] | undefined) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroSegmento, setFiltroSegmento] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    return (data ?? []).filter((c) => {
      if (filtroSegmento && c.segment !== filtroSegmento) return false;
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return (
        c.displayName.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, busqueda, filtroSegmento]);

  return { busqueda, setBusqueda, filtroSegmento, setFiltroSegmento, filtrados };
}

export type { ContactListItem } from "@/lib/contacts-client";
export { useCreateFormState } from "./create-form-state";