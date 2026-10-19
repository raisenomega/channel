/**
 * HUB by Raisen — Bento Card: Búsqueda inteligente (L3). Mismo patrón de card que Estado/Actividad.
 * Cero-mocks: busca de verdad sobre las conversaciones YA cargadas (contactName + lastMessage),
 * sin red extra. Click en un resultado -> abre esa conversación. C4 <=75.
 */
import { useState } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { InboxItem } from "@/lib/types";

export function BentoBusquedaInteligente({ lang, items, onOpen }: {
  lang: Idioma;
  items: readonly InboxItem[];
  onOpen: (conversationId: string) => void;
}) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const matches = query === "" ? [] : items.filter(
    (i) => i.contactName.toLowerCase().includes(query) || i.lastMessage.toLowerCase().includes(query),
  );
  return (
    <div className="bento-card bento-col-3">
      <div className="bento-title">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="9" cy="9" r="6" /><line x1="14" y1="14" x2="18" y2="18" />
        </svg>
        <span>{t(lang, "dash.busquedaInteligente")}</span>
      </div>
      <input
        type="text" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder={t(lang, "dash.busquedaPlaceholder")}
        className="mt-1 w-full rounded-lg border border-border/50 bg-transparent px-3 py-2 text-xs"
      />
      {query !== "" ? (
        matches.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">{t(lang, "dash.sinResultados")}</p>
        ) : (
          <ul className="mt-2 flex flex-col">
            {matches.slice(0, 5).map((i) => (
              <li key={i.conversationId}>
                <button type="button" onClick={() => onOpen(i.conversationId)}
                  className="block w-full border-b border-border/20 py-1.5 text-left last:border-0 hover:text-primary">
                  <span className="block truncate text-xs font-semibold text-foreground">{i.contactName}</span>
                  <span className="block truncate text-[10px] text-dim">{i.lastMessage}</span>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
