/**
 * HUB by Raisen — Bento Card: Actividad reciente (ultimos 5). ALERTA parpadea (gris<->rojo) mientras
 * haya consulta de agente o escalada SIN atender; "Ver todas" abre la lista completa (/actividad).
 * consulta Y escalada -> scope AGENTE (c:{consultaId}, lo que respondes NO va al cliente); cliente ->
 * conversacion. Escalada agente-only autorizada por Jorge (firma). CONGELADO (LEY, ver docs).
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export interface ActivityEvent {
  readonly id: string;
  readonly type: string;
  readonly label: string;
  readonly timestamp: string;
  readonly conversationId?: string | null;
  readonly consultaId?: string | null;
  readonly agentSlug?: string | null;
}

export function BentoActividadReciente({ lang, events, alertas = 0, onOpen, onVerTodas, onHistorial }: {
  lang: Idioma;
  events: readonly ActivityEvent[];
  alertas?: number;
  onOpen?: (conversationId: string) => void;
  onVerTodas?: () => void;
  onHistorial?: () => void;
}) {
  return (
    <div className="bento-card bento-col-3">
      <div className="bento-title">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="10" cy="10" r="7" /><polyline points="10,5 10,10 14,12" />
        </svg>
        <span>{t(lang, "dash.actividadReciente")}</span>
        {alertas > 0 ? <span className="alerta-blink" style={{ marginLeft: "auto" }}>ALERTA</span> : null}
      </div>
      {events.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t(lang, "dash.sinActividad")}</p>
      ) : (
        <ul className="flex flex-col">
          {events.slice(0, 5).map((e) => (
            <li key={e.id} className="border-b border-border/20 last:border-0"><ActivityRow e={e} onOpen={onOpen} /></li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex items-center justify-between text-[11px] text-primary"><button type="button" onClick={onVerTodas} className="hover:underline">{lang === "en" ? "See all" : "Ver todas"}</button>{onHistorial ? <button type="button" onClick={onHistorial} className="hover:underline">{t(lang, "dash.historial")}</button> : null}</div>
    </div>
  );
}

export function ActivityRow({ e, onOpen }: { e: ActivityEvent; onOpen?: (id: string) => void }) {
  const inner = (
    <>
      <Dot type={e.type} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground truncate">{e.label}</p>
        <p className="text-[10px] text-dim">{e.timestamp}</p>
      </div>
    </>
  );
  const target = (e.type === "consulta" || e.type === "escalation") && e.consultaId ? "c:" + e.consultaId : (e.conversationId ?? null); // escalada con hilo -> scope AGENTE (tu respuesta NO va al cliente); legada sin hilo -> conversacion
  if (target && onOpen) {
    return <button type="button" onClick={() => onOpen(target)} className="flex w-full items-start gap-2 py-1.5 text-left hover:text-primary">{inner}</button>;
  }
  return <div className="flex items-start gap-2 py-1.5">{inner}</div>;
}

function Dot({ type }: { type: string }) {
  if (type === "escalation" || type === "consulta") {
    const col = type === "escalation" ? "--high" : "--process"; // cliente=rojo, consulta=proceso
    return <span className="inline-block mt-1 h-2 w-2 rounded-full shrink-0" style={{ background: `hsl(var(${col}))`, boxShadow: `0 0 8px hsl(var(${col}))`, animation: "pulse-glow 1.2s ease-in-out infinite" }} />;
  }
  const hue = type === "tenant_created" ? "var(--success)" : type.startsWith("channel_connected") ? "var(--process)" : type === "message_received" ? "var(--primary)" : type.startsWith("draft_") ? "var(--high)" : "var(--text-dim)";
  return <span className="inline-block mt-1 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: `hsl(${hue})` }} />;
}
