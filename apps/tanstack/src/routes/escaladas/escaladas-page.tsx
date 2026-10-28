/**
 * HUB by Raisen — Pagina Escaladas: todos los tickets de escalada a humano (global del tenant).
 * Encabezado honesto (N abiertas / M resueltas). Clic en una fila -> abre la conversacion completa
 * (/inbox/$conversationId) = toda la evidencia. Al entrar, limpia el badge. C4 <=75.
 */
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { useMarkRead } from "@/lib/alerts/alerts-context";
import { fetchEscaladas } from "./escaladas-fetchers";

export function EscaladasPage() {
  const { language } = usePreferences();
  const markRead = useMarkRead();
  useEffect(() => { markRead("escaladas"); }, [markRead]);
  const { data } = useQuery({ queryKey: ["escaladas"], queryFn: fetchEscaladas, refetchInterval: 15000 });
  const tickets = data ?? [];
  const abiertas = tickets.filter((x) => x.status !== "resolved").length;
  const resueltas = tickets.length - abiertas;

  return (
    <section className="mx-auto w-full max-w-3xl p-4">
      <h1 className="text-lg font-bold text-foreground">{t(language, "escaladas.title")}</h1>
      <p className="mb-3 text-xs text-muted-foreground">{abiertas} {t(language, "escaladas.abiertas")} · {resueltas} {t(language, "escaladas.resueltas")}</p>
      {tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t(language, "escaladas.vacio")}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {tickets.map((x) => (
            <li key={x.conversationId}>
              <Link to="/inbox/$conversationId" params={{ conversationId: x.conversationId }}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/30 px-3 py-2 hover:text-primary">
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{x.label}</span>
                <span className="shrink-0 text-[10px] text-dim">
                  {t(language, x.status === "resolved" ? "escaladas.resuelto" : "escaladas.abierto")} · {x.createdAt.slice(0, 10)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
