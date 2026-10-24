/**
 * HUB by Raisen — Control de Modo al final de los chips: boton "Modo: X" -> abre el panel de config. C4 <=75.
 */
import { useState } from "react";
import { t, type Idioma } from "@/lib/i18n";
import { useAgentConfig } from "@/hooks/useAgentConfig";
import { ConfigPanel } from "./config-panel";

const COLOR: Record<string, string> = { off: "", supervised: "35 90% 55%", autonomous: "150 65% 45%" };

export function ModeControl({ lang }: { lang: Idioma }) {
  const { mode } = useAgentConfig();
  const [open, setOpen] = useState(false);
  const c = COLOR[mode] || "";
  return (
    <div className="relative ml-auto">
      <button type="button" onClick={() => setOpen((o) => !o)} className="chip inline-flex items-center gap-1 text-xs font-bold" style={{ color: c ? `hsl(${c})` : undefined, borderColor: c ? `hsl(${c})` : undefined }}>
        {t(lang, "mode.label")}: {t(lang, "mode." + mode)}
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-1 rounded-xl border border-border/50 bg-card p-3 shadow-xl">
            <ConfigPanel lang={lang} onClose={() => setOpen(false)} />
          </div>
        </>
      ) : null}
    </div>
  );
}
