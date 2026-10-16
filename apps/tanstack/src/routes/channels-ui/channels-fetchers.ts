import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listarCanales, toggleCanal } from "@/lib/channels-client";
import { handleFetcherError } from "@/lib/redirect-on-error";
import type { Channel } from "@/lib/channels-client";

export function useCanales() {
  const [err, setErr] = useState(false);

  const query = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const r = await listarCanales();
      if (!r.ok) {
        if (r.error.kind === "config_incompleta" || r.error.kind === "no_autorizado") {
          handleFetcherError(r.error.kind as "config_incompleta" | "no_autorizado");
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