import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listarIntegraciones, toggleIntegracion } from "@/lib/integrations-client";
import type { Integration } from "@/lib/integrations-client";

export function useIntegraciones() {
  const [syncErr, setSyncErr] = useState(false);

  const query = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const r = await listarIntegraciones();
      if (!r.ok) {
        setSyncErr(true);
        return [];
      }
      setSyncErr(false);
      return r.value;
    },
    staleTime: 30_000,
  });

  return { ...query, syncErr, setSyncErr };
}

export async function onToggle(
  integracion: Integration | undefined,
  v: boolean,
  setPendiente: (v: boolean) => void,
) {
  if (!integracion) return;
  setPendiente(true);
  await toggleIntegracion(integracion.id, v);
  setPendiente(false);
}