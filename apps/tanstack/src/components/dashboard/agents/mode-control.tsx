/**
 * HUB by Raisen — Control de Modo (al final de los chips): boton "Modo" -> panel minimalista con el modo
 * (Apagado / Supervisado naranja / Autonomo verde) + guardrails, en un solo lugar. Autonomo = S7. C4 <=75.
 */
import { useState } from "react";
import { t, type Idioma } from "@/lib/i18n";
import { useAgentMode } from "@/hooks/useAgentMode";

const MODES = [
  { id: "off", color: "", label: "mode.off", soon: false },
  { id: "supervised", color: "35 90% 55%", label: "mode.supervised", soon: false },
  { id: "autonomous", color: "150 65% 45%", label: "mode.autonomous", soon: true },
];

export function ModeControl({ lang }: { lang: Idioma }) {
  const { mode, setMode, busy } = useAgentMode();
  const [open, setOpen] = useState(false);
  const cur = MODES.find((m) => m.id === mode) ?? MODES[0]!;
  const tint = (c: string) => (c ? `hsl(${c})` : undefined);
  return (
    <div className="relative ml-auto">
      <button type="button" onClick={() => setOpen((o) => !o)} className="chip inline-flex items-center gap-1 text-xs font-bold" style={{ color: tint(cur.color), borderColor: tint(cur.color) }}>
        {t(lang, "mode.label")}: {t(lang, cur.label)}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-40 mt-1 w-64 rounded-xl border border-border/50 bg-card p-3 shadow-xl">
          <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">{t(lang, "mode.title")}</p>
          <div className="space-y-1">
            {MODES.map((m) => (
              <button key={m.id} type="button" disabled={busy || m.soon} onClick={() => { void setMode(m.id); setOpen(false); }} className={"flex w-full items-center justify-between rounded-lg border px-2 py-1.5 text-xs disabled:opacity-50" + (mode === m.id ? " font-bold" : "")} style={{ borderColor: mode === m.id ? tint(m.color) ?? "hsl(var(--border))" : "hsl(var(--border))", color: tint(m.color) }}>
                <span>{t(lang, m.label)}</span>
                {m.soon ? <span className="text-[9px] uppercase text-muted-foreground">{t(lang, "mode.soon")}</span> : null}
              </button>
            ))}
          </div>
          <p className="mt-2 border-t border-border/40 pt-2 text-[10px] text-muted-foreground">{t(lang, "mode.guardrails")}</p>
        </div>
      ) : null}
    </div>
  );
}
