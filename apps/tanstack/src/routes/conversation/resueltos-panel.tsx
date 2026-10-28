/**
 * HUB by Raisen — Panel derecho de la conversacion: tickets RESUELTOS (global). Filas estilo Ficha 360
 * (quien atendio + fecha/hora). Clic en una fila -> abre esa conversacion (su historia/evidencia). C4 <=75.
 */
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchTicketsResueltos } from "./resueltos-fetch";

export function ResueltosPanel({ language, onOpen }: { language: Idioma; onOpen: (conversationId: string) => void }) {
  const { data } = useQuery({ queryKey: ["tickets-resueltos"], queryFn: fetchTicketsResueltos, refetchInterval: 15000 });
  const rows = data ?? [];
  return (
    <div className="rounded-2xl glass-card p-4" data-tickets-resueltos>
      <h3 className="mb-3 font-display text-base font-bold text-foreground">{t(language, "resueltos.titulo")}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t(language, "resueltos.vacio")}</p>
      ) : (
        rows.map((x) => (
          <button key={x.consultaId || x.conversationId} type="button"
            onClick={() => onOpen(x.tipo === "consulta" ? "c:" + x.consultaId : x.conversationId)}
            className="flex w-full items-center gap-2 text-left hover:text-primary"
            style={{ padding: "7px 0", borderBottom: "1px solid hsl(var(--border) / 0.25)" }}>
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{x.label || (x.consultaId || x.conversationId).slice(0, 8)}</span>
            <span className="ml-auto shrink-0 text-xs text-primary">{(x.atendio || "—")} · {x.createdAt.slice(0, 16).replace("T", " ")}</span>
          </button>
        ))
      )}
    </div>
  );
}
