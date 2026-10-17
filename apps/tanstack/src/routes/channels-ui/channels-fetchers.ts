/**
 * HUB by Raisen — Fetchers de /channels (Hotfix L-2).
 * L-2: config_incompleta YA NO llama a handleFetcherError (cero redirect). La
 * pagina sigue en /channels y renderiza el CATALOGO completo + banner con CTA.
 * Solo no_autorizado (sesion caida) delega al helper -> /login.
 * C4 <=75.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listarCanales, toggleCanal } from "@/lib/channels-client";
import { handleFetcherError } from "@/lib/redirect-on-error";
import type { Channel, ChannelError } from "@/lib/channels-client";

export type CanalesErrKind = ChannelError["kind"] | null;

export function useCanales() {
  const [errKind, setErrKind] = useState<CanalesErrKind>(null);

  const query = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const r = await listarCanales();
      if (!r.ok) {
        if (r.error.kind === "no_autorizado") {
          handleFetcherError("no_autorizado");
        }
        setErrKind(r.error.kind);
        return [];
      }
      setErrKind(null);
      return r.value;
    },
    staleTime: 30_000,
  });

  return { ...query, errKind, err: errKind !== null };
}

export function onToggleCanal(canal: Channel | undefined, v: boolean) {
  if (!canal) return;
  void toggleCanal(canal.id, v);
}
