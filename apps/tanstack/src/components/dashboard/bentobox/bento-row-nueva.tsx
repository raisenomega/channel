/**
 * HUB by Raisen — Bento Row Nueva: EstadoAgentes + Actividad.
 * R-1: la card AgregarCliente se elimino; el CTA [+] vive ahora en el KPI Tenant.
 */
import type { Idioma } from "@/lib/i18n";
import { BentoEstadoAgentes } from "./bento-estado-agentes";
import { BentoActividadReciente, type ActivityEvent } from "./bento-actividad-reciente";

export function BentoRowNueva({ lang, events }: {
  lang: Idioma;
  events: readonly ActivityEvent[];
}) {
  return (
    <div className="bento mt-4">
      <BentoEstadoAgentes lang={lang} />
      <BentoActividadReciente lang={lang} events={events} />
    </div>
  );
}