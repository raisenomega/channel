/**
 * HUB by Raisen — Bento Row (L3) del Panel: 4 cards en una línea (col-3 c/u):
 * Estado de agentes · Actividad reciente · Peticiones · Búsqueda inteligente.
 * SOT: docs/DASHBOARD_PANEL_SOT.md. El alta de negocio NO vive aquí (va en la barra WhatsApp).
 */
import type { Idioma } from "@/lib/i18n";
import type { InboxItem } from "@/lib/types";
import { BentoEstadoAgentes } from "./bento-estado-agentes";
import { BentoActividadReciente, type ActivityEvent } from "./bento-actividad-reciente";
import { BentoPeticiones, type Peticion } from "./bento-peticiones";
import { BentoBusquedaInteligente } from "./bento-busqueda-inteligente";

export function BentoRowNueva({ lang, events, alertas, peticiones, items, onOpen, onVerTodas, onHistorial }: {
  lang: Idioma;
  events: readonly ActivityEvent[];
  alertas?: number;
  peticiones: readonly Peticion[];
  items: readonly InboxItem[];
  onOpen: (conversationId: string) => void;
  onVerTodas?: () => void;
  onHistorial?: () => void;
}) {
  return (
    <div className="bento mt-4">
      <BentoEstadoAgentes lang={lang} />
      <BentoActividadReciente lang={lang} events={events} alertas={alertas} onOpen={onOpen} onVerTodas={onVerTodas} onHistorial={onHistorial} />
      <BentoPeticiones lang={lang} items={peticiones} />
      <BentoBusquedaInteligente lang={lang} items={items} onOpen={onOpen} />
    </div>
  );
}
