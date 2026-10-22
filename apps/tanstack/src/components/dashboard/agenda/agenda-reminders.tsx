/**
 * HUB by Raisen — Selector de recordatorios (momentos antes de la cita, en minutos). C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";

const PRESETS: { min: number; key: string }[] = [
  { min: 1440, key: "d1" },
  { min: 120, key: "h2" },
  { min: 60, key: "h1" },
  { min: 30, key: "m30" },
  { min: 15, key: "m15" },
];

export function AgendaReminders({ lang, accent, value, onChange }: {
  lang: Idioma;
  accent: string;
  value: number[];
  onChange: (v: number[]) => void;
}) {
  const toggle = (min: number) => onChange(value.includes(min) ? value.filter((x) => x !== min) : [...value, min].sort((a, b) => b - a));
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRESETS.map((p) => {
        const on = value.includes(p.min);
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => toggle(p.min)}
            className={"chip text-[11px]" + (on ? " active" : "")}
            style={on ? { color: `hsl(${accent})`, borderColor: `hsl(${accent})` } : undefined}
          >
            {t(lang, "agenda.rem." + p.key)}
          </button>
        );
      })}
    </div>
  );
}
