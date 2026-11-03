/**
 * HUB by Raisen — Preview EN VIVO de la plantilla tal como se vera al ENVIAR, por canal (WA/IG/FB).
 * Renderiza encabezado (texto o foto) + cuerpo + boton con link, con el chrome REAL de cada red
 * (CHANNEL_META). Se actualiza mientras el usuario rellena. C4 <=75. Sin any.
 */
import type { ChannelKind } from "@/components/ui/channel-icon";
import { CHANNEL_META } from "@/components/dashboard/channel/channel-meta";
import type { UsageDraft } from "@/lib/templates-client/template-draft";

const CANALES: ChannelKind[] = ["whatsapp", "instagram", "facebook"];
const NOMBRE: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook" };

export function TemplatePreview({ draft, canal, onCanal }: {
  draft: UsageDraft; canal: ChannelKind; onCanal: (c: ChannelKind) => void;
}) {
  const m = CHANNEL_META[canal];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {CANALES.map((c) => (
          <button key={c} type="button" onClick={() => onCanal(c)} className={"chip text-xs " + (c === canal ? "font-bold" : "")}
            style={c === canal ? { color: `hsl(${CHANNEL_META[c].hsl})`, borderColor: `hsl(${CHANNEL_META[c].hsl})` } : undefined}>{NOMBRE[c]}</button>
        ))}
      </div>
      <div className="rounded-2xl p-3" style={{ background: m.bg, minHeight: 240 }}>
        <div className="max-w-[85%] rounded-lg p-2 shadow-sm" style={{ background: m.bubbleIn, color: m.fg }}>
          {draft.headerMode === "image" && draft.imageUrl.trim() ? <img src={draft.imageUrl} alt="" className="mb-2 max-h-40 w-full rounded object-cover" /> : null}
          {draft.headerMode === "text" && draft.headerText.trim() ? <p className="mb-1 text-sm font-bold">{draft.headerText}</p> : null}
          <p className="whitespace-pre-wrap text-sm">{draft.body.trim() || "(cuerpo del mensaje)"}</p>
          {draft.linkUrl.trim() ? (
            <div className="mt-2 border-t pt-2 text-center text-sm font-semibold" style={{ color: m.hex, borderColor: `${m.muted}55` }}>{draft.linkText.trim() || "Ver mas"}</div>
          ) : null}
        </div>
        <p className="mt-2 text-[10px]" style={{ color: m.muted }}>Vista previa {NOMBRE[canal]} — asi lo vera tu cliente al enviar.</p>
      </div>
    </div>
  );
}
