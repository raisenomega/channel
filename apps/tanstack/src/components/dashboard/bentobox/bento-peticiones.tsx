/**
 * HUB by Raisen — Bento Card: Peticiones (L3). Mismo patrón que Actividad/Estado-agentes.
 * Cero-mocks: sin endpoint de peticiones aún -> estado vacío honesto (nunca datos inventados).
 * Cuando exista fuente real, se alimenta por `items` (misma forma que Actividad). C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export interface Peticion {
  readonly id: string;
  readonly label: string;
  readonly timestamp: string;
  readonly tone?: "accepted" | "rejected";
}

export function BentoPeticiones({ lang, items = [] }: {
  lang: Idioma;
  items?: readonly Peticion[];
}) {
  return (
    <div className="bento-card bento-col-3">
      <div className="bento-title">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 4h12v9H8l-4 3V4Z" />
        </svg>
        <span>{t(lang, "dash.peticiones")}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t(lang, "dash.sinPeticiones")}</p>
      ) : (
        <ul className="flex flex-col">
          {items.slice(0, 5).map((p) => (
            <li key={p.id} className="flex items-start gap-2 border-b border-border/20 py-1.5 last:border-0">
              <span className="inline-block mt-1 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: `hsl(${p.tone === "accepted" ? "var(--success)" : "var(--high)"})` }} />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground truncate">{p.label}</p>
                <p className="text-[10px] text-dim">{p.timestamp}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
