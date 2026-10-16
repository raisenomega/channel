import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listarCanales, toggleCanal } from "@/lib/channels-client";
import type { Channel } from "@/lib/channels-client";

export function useCanales() {
  const [err, setErr] = useState(false);

  const query = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const r = await listarCanales();
      if (!r.ok) {
        if (r.error.kind === "config_incompleta") {
          if (typeof window !== "undefined") {
            // Sin tenant_id en JWT = user autenticado sin tenant → crear tenant primero
            window.location.href = "/onboarding/tenant";
          }
        }
        if (r.error.kind === "no_autorizado") {
          if (typeof window !== "undefined") {
            // Sesión real cerrada → login
            window.location.href = "/login";
          }
        }
        setErr(true);
        return [];
      }
      setErr(false);
      return r.value;
    },
    staleTime: 30_000,
  });

  return { ...query, err };
}

export function onToggleCanal(canal: Channel | undefined, v: boolean) {
  if (!canal) return;
  void toggleCanal(canal.id, v);
}