/**
 * HUB by Raisen — Panel derecho de la conversacion: tickets CERRADOS (global), PAGINADO 12/pagina + altura
 * FIJA (h-[72vh], como el chat) para que ninguna fila pase abajo de pantalla y la pagina no crezca. Clic en
 * una fila -> abre esa conversacion/consulta (chat + ficha 360). C4 <=75.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchHistorial } from "./resueltos-fetch";

export function ResueltosPanel({ language, onOpen }: { language: Idioma; onOpen: (conversationId: string) => void }) {
  const [page, setPage] = useState(0);
  const { data } = useQuery({ queryKey: ["resueltos-panel", page], queryFn: () => fetchHistorial(page, 12), refetchInterval: 15000 });
  const rows = data?.rows ?? []; const total = data?.total ?? 0; const pages = Math.max(1, Math.ceil(total / 12));
  return (
    <div className="rounded-2xl glass-card flex h-[72vh] flex-col p-4" data-tickets-resueltos>
      <h3 className="mb-3 font-display text-base font-bold text-foreground">{t(language, "resueltos.titulo")} <span className="text-xs font-normal text-muted-foreground">({total})</span></h3>
      <div className="min-h-0 flex-1 overflow-hidden">
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">{t(language, "resueltos.vacio")}</p> : rows.map((x) => (
          <button key={x.consultaId || x.conversationId} type="button"
            onClick={() => onOpen(x.consultaId ? "c:" + x.consultaId : x.conversationId)}
            className="flex w-full items-center gap-2 text-left hover:text-primary"
            style={{ padding: "7px 0", borderBottom: "1px solid hsl(var(--border) / 0.25)" }}>
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{x.label || (x.consultaId || x.conversationId).slice(0, 8)}</span>
            <span className="ml-auto shrink-0 text-xs text-primary">{(x.atendio || "—")} · {x.createdAt.slice(0, 16).replace("T", " ")}</span>
          </button>
        ))}
      </div>
      {total > 12 ? (
        <div className="mt-2 flex items-center justify-between text-xs">
          <button type="button" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="chip disabled:opacity-40">{t(language, "hist.prev")}</button>
          <span className="text-muted-foreground">{t(language, "hist.pagina")} {page + 1} / {pages}</span>
          <button type="button" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)} className="chip disabled:opacity-40">{t(language, "hist.next")}</button>
        </div>
      ) : null}
    </div>
  );
}
