/**
 * HUB by Raisen — Pestañas de negocio del ChannelFrame (pills .chip).
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { TABS, type ChannelTab } from "./channel-tabs";
import { BorradoresBadge } from "@/components/layout/borradores-badge";
import { PlantillasBadge } from "@/components/layout/plantillas-badge";
import { limpiarPlantillasNuevas } from "@/lib/plantillas-badge";

export function ChannelTabs({ lang, accent, active, onTabChange }: {
  lang: Idioma;
  accent: string;
  active?: ChannelTab;
  onTabChange?: (tab: ChannelTab) => void;
}) {
  return (
    <nav className="cf-tabs" aria-label={t(lang, "cf.tabsLabel")}>
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          className={"chip" + (active === tab ? " active" : "")}
          onClick={() => { if (tab === "plantillas") { limpiarPlantillasNuevas(); window.dispatchEvent(new Event("plantillas-badge")); } onTabChange?.(tab); }}
          style={active === tab ? { color: `hsl(${accent})`, borderColor: `hsl(${accent})` } : undefined}
        >
          <span className="chip-name">{t(lang, "cf." + tab)}</span>
          {tab === "borradores" ? <BorradoresBadge /> : null}
          {tab === "plantillas" ? <PlantillasBadge /> : null}
        </button>
      ))}
    </nav>
  );
}