/**
 * HUB by Raisen — Adjuntar media a la cita (documento/imagen/video). Lista persistente con [X] para
 * eliminar; muestra error si la subida falla (bucket/policy). Cada item es un enlace. C4 <=75.
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
  const [err, setErr] = useState<string | null>(null);
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true); setErr(null);
    const r = await uploadApptMedia(tenantId, file);
    setBusy(false);
    if (r.ok) onChange([...value, r.item]); else setErr(r.error);
  };
  return (
    <div className="space-y-1">
      {value.map((m, i) => (
        <div key={m.url} className="flex items-center justify-between gap-2 rounded bg-muted/20 px-2 py-1 text-xs">
          <a href={m.url} target="_blank" rel="noopener noreferrer" className="truncate text-foreground hover:underline">{m.type} - {m.name}</a>
          <button type="button" className="shrink-0 font-bold text-red-400" title={t(lang, "agenda.eliminar")} onClick={() => onChange(value.filter((_, j) => j !== i))}>X</button>
        </div>
      ))}
      <label className="chip inline-block cursor-pointer text-[11px]" style={{ color: `hsl(${accent})`, borderColor: `hsl(${accent})` }}>
        {busy ? t(lang, "onboarding.saving") : t(lang, "agenda.f.media")}
        <input type="file" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
      </label>
      {err && <p className="text-[11px] text-red-400">{t(lang, "agenda.err")}: {err}</p>}
    </div>
  );
}
