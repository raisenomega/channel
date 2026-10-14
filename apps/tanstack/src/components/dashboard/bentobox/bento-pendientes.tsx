import type { InboxItem } from "@/lib/types";
import { t, type Idioma } from "@/lib/i18n";

/* ===== Pendientes (derivados reales) ===== */

export function Pendientes({ items, lang }: {
  items: readonly InboxItem[]; lang: Idioma;
}) {
  const sinAsignar = items.filter((i) => !i.assignedTo).length;
  const sla = items.filter((i) => i.slaViolated).length;
  const abiertas = items.filter((i) => i.status === "open").length;

  return (
    <ul className="bento-pending">
      <li>
        <span className="dotx from-zernio" />
        <div className="tx">
          <b>{t(lang, "dash.pend.asignar")}</b>
          <span>{sinAsignar} {t(lang, "inbox.total")}</span>
        </div>
      </li>
      <li>
        <span className="dotx to-send" />
        <div className="tx">
          <b>{t(lang, "dash.pend.seguimiento")}</b>
          <span>{abiertas} {t(lang, "inbox.active")}</span>
        </div>
      </li>
      <li>
        <span className="dotx sla-risk" />
        <div className="tx">
          <b>{t(lang, "dash.pend.sla")}</b>
          <span>{sla} {t(lang, "inbox.filtros")}</span>
        </div>
      </li>
      <li>
        <span className="dotx vip" />
        <div className="tx">
          <b>{t(lang, "dash.pend.autonomia")}</b>
          <span>{t(lang, "dash.agents")}</span>
        </div>
      </li>
    </ul>
  );
}