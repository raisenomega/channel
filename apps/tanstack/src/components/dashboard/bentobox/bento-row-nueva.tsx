/**
 * HUB by Raisen — Bento Row Nueva: cards AgregarCliente + EstadoAgentes + Actividad.
 */
import type { Idioma } from "@/lib/i18n";
import { BentoAgregarCliente } from "./bento-agregar-cliente";
import { BentoEstadoAgentes } from "./bento-estado-agentes";
import { BentoActividadReciente, type ActivityEvent } from "./bento-actividad-reciente";

export function BentoRowNueva({ lang, onOpen, events }: {
  lang: Idioma;
  onOpen: () => void;
  events: readonly ActivityEvent[];
}) {
  return (
    <div className="bento mt-4">
      <BentoAgregarCliente lang={lang} onOpen={onOpen} />
      <BentoEstadoAgentes lang={lang} />
      <BentoActividadReciente lang={lang} events={events} />
    </div>
  );
}