/**
 * HUB by Raisen — Banner "Trilogía Raisen" (reemplaza la vieja barra de filtros; esa función ya vive
 * en la fila superior). Crea la necesidad de las 3 plataformas que se alimentan entre sí:
 * HUB (atiende y vende) + OMEGA (marketing) + NÚCLEO (operación) -> de PYME a empresa. C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";

const OMEGA = "https://www.omegaraisen.agency";
const NUCLEO = "https://www.nucleoraisen.com";

export function TrilogiaBar({ language }: { language: Idioma }) {
  // Estilo tarjeta KPI: solo borde amarillo (primary) + letras blancas + hover que se eleva y da glow.
  // (Futuro: variante VERDE "conectado" cuando el cliente haya pagado y conectado la plataforma.)
  const cta = "inline-flex items-center justify-center rounded-xl border border-primary/50 bg-transparent px-4 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_0_26px_-8px_hsl(var(--primary)/0.45)]";
  return (
    <div className="bento-card bento-col-12 mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">{t(language, "trilogia.headline")}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t(language, "trilogia.body")}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <a href={OMEGA} target="_blank" rel="noopener noreferrer" className={cta}>
          {t(language, "trilogia.ctaOmega")}
        </a>
        <a href={NUCLEO} target="_blank" rel="noopener noreferrer" className={cta}>
          {t(language, "trilogia.ctaNucleo")}
        </a>
      </div>
    </div>
  );
}
