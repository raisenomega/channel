/**
 * HUB by Raisen — Barra de canales (solo iconos + badge, sin nombres), misma medida que "Crear negocio".
 * Conectados en su COLOR de marca real; no conectados en GRIS apagado (dato real de listarCanales).
 * WhatsApp usa el MISMO icono de crear-negocio (WhatsAppIcon, size 22) heredado por todos. C4 <=75.
 */
import { useQuery } from "@tanstack/react-query";
import { ChannelIcon } from "@/components/ui/channel-icon";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { AlertBadge } from "@/components/ui/alert-badge";
import { listarCanales } from "@/lib/channels-client/functions";

const BAR = ["whatsapp", "instagram", "facebook", "telegram", "email", "linkedin", "tiktok"] as const;
const COLOR: Record<string, string> = {
  instagram: "#d62976", facebook: "#1877F2", telegram: "#26A5E4", email: "#EA4335", linkedin: "#0A66C2", tiktok: "#ffffff",
};
const GRIS = "#4b5563";
const TIKTOK = "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z";

export function TopChannelsBar({ onCanalNav }: { onCanalNav: (c: string) => void }) {
  const { data } = useQuery({ queryKey: ["dash-channels"], queryFn: listarCanales, staleTime: 30_000 });
  const on = new Set<string>((data?.ok ? data.value : []).filter((c) => c.state === "conectado").map((c) => c.kind));
  return (
    <div className="bento-col-3 flex items-center justify-around gap-1 rounded-2xl glass-card p-3.5">
      {BAR.map((k) => {
        const activo = on.has(k);
        return (
          <button key={k} type="button" onClick={() => onCanalNav(k)} title={k} aria-label={k}
            className="relative grid place-items-center rounded-lg p-1 transition hover:bg-foreground/5">
            {k === "whatsapp"
              ? <WhatsAppIcon size={22} className={activo ? "" : "opacity-40 grayscale"} />
              : k === "tiktok"
                ? <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: activo ? COLOR[k] : GRIS }}><path d={TIKTOK} /></svg>
                : <ChannelIcon kind={k} width={22} height={22} style={{ color: activo ? COLOR[k] : GRIS }} />}
            <AlertBadge keyName={"channel:" + k} className="absolute -right-1 -top-1" />
          </button>
        );
      })}
    </div>
  );
}
