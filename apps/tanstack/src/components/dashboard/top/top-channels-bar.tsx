/**
 * HUB by Raisen — Barra de canales (solo iconos + badge, sin nombres) encima de "Conversaciones abiertas".
 * Conectados en su COLOR de marca real; no conectados en GRIS apagado (dato real de listarCanales).
 * Clic en un icono -> su ruta /channels/:kind (celular shell + hilos). C4 <=75.
 */
import { useQuery } from "@tanstack/react-query";
import { ChannelIcon } from "@/components/ui/channel-icon";
import { AlertBadge } from "@/components/ui/alert-badge";
import { listarCanales } from "@/lib/channels-client/functions";

const BAR = ["whatsapp", "instagram", "facebook", "telegram", "email", "linkedin", "tiktok"] as const;
const COLOR: Record<string, string> = {
  whatsapp: "#25D366", instagram: "#d62976", facebook: "#1877F2",
  telegram: "#26A5E4", email: "#EA4335", linkedin: "#0A66C2", tiktok: "#ffffff",
};
const GRIS = "#4b5563";
const TIKTOK = "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z";

export function TopChannelsBar({ onCanalNav }: { onCanalNav: (c: string) => void }) {
  const { data } = useQuery({ queryKey: ["dash-channels"], queryFn: listarCanales, staleTime: 30_000 });
  const on = new Set<string>((data?.ok ? data.value : []).filter((c) => c.state === "conectado").map((c) => c.kind));
  return (
    <div className="bento-card bento-col-3 flex items-center justify-around gap-1 py-2">
      {BAR.map((k) => {
        const color = on.has(k) ? COLOR[k] : GRIS;
        return (
          <button key={k} type="button" onClick={() => onCanalNav(k)} title={k} aria-label={k}
            className="relative grid place-items-center rounded-lg p-1.5 transition hover:bg-foreground/5">
            {k === "tiktok"
              ? <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color }}><path d={TIKTOK} /></svg>
              : <ChannelIcon kind={k} width={18} height={18} style={{ color }} />}
            <AlertBadge keyName={"channel:" + k} className="absolute -right-1 -top-1" />
          </button>
        );
      })}
    </div>
  );
}
