/**
 * HUB by Raisen — Barra de llamada encima de "Total": botón VERDE (hacer llamada) + ROJO (terminar).
 * Scaffold VISIBLE pero INERTE: aún no hay backend de llamadas; se cablean cuando llegue esa parte.
 * (No muestra datos falsos: son controles, no un dato inventado.) C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";

const PHONE = "M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z";

function Icono({ hang }: { hang?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className={hang ? "rotate-[135deg]" : ""}>
      <path d={PHONE} />
    </svg>
  );
}

export function TopCallBar({ lang }: { lang: Idioma }) {
  const btn = "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white";
  return (
    <div className="bento-card bento-col-3 flex items-center justify-center gap-2 py-2">
      <button type="button" title={t(lang, "call.start")} className={btn + " bg-success"}>
        <Icono /> {t(lang, "call.start")}
      </button>
      <button type="button" title={t(lang, "call.end")} className={btn + " bg-critical"}>
        <Icono hang /> {t(lang, "call.end")}
      </button>
    </div>
  );
}
