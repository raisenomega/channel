import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { ZernioConnectButton } from "@/components/channels/ZernioConnectButton";
import { SOCIAL_PLATFORMS } from "@/channels/domain/social-account.entity";
import { platformLabel } from "@/lib/zernioConnect";

interface Props { tenantId: string; }

/** Sección 4 del onboarding HUB — Cuentas sociales (Slide 4.2a).
 * Lista las 7 plataformas con ZernioConnectButton cada una.
 * B-2 headless: escucha BroadcastChannel del popup OAuth. */
export function SectionSocialAccounts({ tenantId }: Props) {
  const { data: connected, refetch: refetchConnected } = useQuery({
    queryKey: ["zernio_connected", tenantId],
    queryFn: () => apiGet<{ items: ConnectedItem[] }>(`/tenants/${tenantId}/connected-accounts`),
  });
  const items = connected?.items ?? [];

  useEffect(() => {
    const handle = (d: { source?: string; status?: string } | null) => {
      if (d?.source === "zernio" && d.status === "connected") void refetchConnected();
    };
    let ch: BroadcastChannel | null = null;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "zernio-oauth" || !e.newValue) return;
      try { handle(JSON.parse(e.newValue)); } catch { /* noop */ }
    };
    if (typeof BroadcastChannel !== "undefined") {
      ch = new BroadcastChannel("zernio-oauth");
      ch.onmessage = (e) => handle(e.data);
    } else {
      window.addEventListener("storage", onStorage);
    }
    return () => { ch?.close(); window.removeEventListener("storage", onStorage); };
  }, [refetchConnected]);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">Conectá las redes de tu negocio para que HUB pueda gestionar mensajes.</p>
      {SOCIAL_PLATFORMS.map((platform) => {
        const connectedItem = items.find((i) => i.platform === platform);
        return (
          <div key={platform} className="flex items-center justify-between py-1">
            <span className="text-sm">{platformLabel(platform)}</span>
            <ZernioConnectButton tenantId={tenantId} platform={platform} connected={!!connectedItem} onSynced={() => void refetchConnected()} />
          </div>
        );
      })}
    </div>
  );
}