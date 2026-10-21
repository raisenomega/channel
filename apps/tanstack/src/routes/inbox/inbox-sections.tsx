/**
 * HUB by Raisen — Banner "Trilogía Raisen" (reemplaza la vieja barra de filtros; esa función ya vive
 * en la fila superior). Crea la necesidad de las 3 plataformas que se alimentan entre sí:
 * HUB (atiende y vende) + OMEGA (marketing) + NÚCLEO (operación) -> de PYME a empresa. C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";

const OMEGA = "https://www.omegaraisen.agency";
const NUCLEO = "https://www.nucleoraisen.com";

export function TrilogiaBar({ language }: { language: Idioma }) {
  const cta = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-110";
  return (
    <div className="bento-card bento-col-12 mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground">{t(language, "trilogia.headline")}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t(language, "trilogia.body")}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <a href={OMEGA} target="_blank" rel="noopener noreferrer" className={cta + " bg-[#6C63FF]"}>
          {t(language, "trilogia.ctaOmega")}
        </a>
        <a href={NUCLEO} target="_blank" rel="noopener noreferrer" className={cta + " bg-[#0ea5e9]"}>
          {t(language, "trilogia.ctaNucleo")}
        </a>
      </div>
    </div>
  );
}
