/**
 * HUB by Raisen — Adjuntar media a la cita (documento/imagen/video) subiendo a Storage. C4 <=75.
 */
import { useState } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { uploadApptMedia } from "./agenda-media";
import type { MediaItem } from "./agenda-types";

export function AgendaMediaUpload({ lang, accent, tenantId, value, onChange }: {
  lang: Idioma;
  accent: string;
  tenantId: string;
  value: MediaItem[];
  onChange: (v: MediaItem[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const m = await uploadApptMedia(tenantId, file);
    setBusy(false);
    if (m) onChange([...value, m]);
  };
  return (
    <div className="space-y-1">
      {value.map((m, i) => (
        <div key={m.url} className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate text-foreground">{m.type} - {m.name}</span>
          <button type="button" className="shrink-0 text-red-400" onClick={() => onChange(value.filter((_, j) => j !== i))}>x</button>
        </div>
      ))}
      <label className="chip inline-block cursor-pointer text-[11px]" style={{ color: `hsl(${accent})`, borderColor: `hsl(${accent})` }}>
        {busy ? t(lang, "onboarding.saving") : t(lang, "agenda.f.media")}
        <input type="file" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
      </label>
    </div>
  );
}
