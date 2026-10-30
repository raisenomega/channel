/**
 * HUB by Raisen — Historial COMPLETO de tickets CERRADOS (desde el dia uno), paginado 18/pagina. Clic en una
 * fila abre su conversacion/consulta (chat + ficha 360 + ticket). Nunca se pierde ninguno. C4 <=75.
 */
import { createRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { fetchHistorial } from "@/routes/conversation/resueltos-fetch";

function HistorialPage() {
  const { language } = usePreferences();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const { data } = useQuery({ queryKey: ["historial", page], queryFn: () => fetchHistorial(page) });
  const rows = data?.rows ?? []; const total = data?.total ?? 0; const pages = Math.max(1, Math.ceil(total / 18));
  const abrir = (r: { consultaId: string; conversationId: string }) => void navigate({ to: "/inbox/" + encodeURIComponent(r.consultaId ? "c:" + r.consultaId : r.conversationId) });
  return (
    <div className="view">
      <h2 className="mt-4 mb-3 font-display text-lg font-bold text-foreground">{t(language, "hist.titulo")} <span className="text-sm font-normal text-muted-foreground">({total})</span></h2>
      <div className="rounded-2xl glass-card p-4">
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">{t(language, "hist.vacio")}</p> : (
          <ul className="flex flex-col">
            {rows.map((r) => (
              <li key={r.consultaId || r.conversationId} className="border-b border-border/20 last:border-0">
                <button type="button" onClick={() => abrir(r)} className="flex w-full items-center gap-2 py-2 text-left hover:text-primary">
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{r.label || (r.consultaId || r.conversationId).slice(0, 8)}</span>
                  <span className="ml-auto shrink-0 text-xs text-primary">{(r.atendio || "—")} · {r.createdAt.slice(0, 16).replace("T", " ")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex items-center justify-between text-xs">
          <button type="button" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="chip disabled:opacity-40">{t(language, "hist.prev")}</button>
          <span className="text-muted-foreground">{t(language, "hist.pagina")} {page + 1} / {pages}</span>
          <button type="button" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)} className="chip disabled:opacity-40">{t(language, "hist.next")}</button>
        </div>
      </div>
    </div>
  );
}

const HistorialRoute = createRoute({ getParentRoute: () => rootRoute, path: "/historial", component: HistorialPage });
export { HistorialRoute };
