/**
 * HUB by Raisen — Vista del scope AGENTE (consulta). MISMO layout, componentes Y FLUJO que el cliente:
 * ChatPanel (composer = seguir el hilo; [Solucionado] -> modal de firma -> [Guardar]) | ContactPanel
 * (Ficha 360 del AGENTE) | ResueltosPanel. El cierre escribe resolved + agent_knowledge (todos lo
 * citan) y aterriza en Tickets Resueltos; reabrir desde Resueltos permite seguir. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { ChatPanel } from "./conversation-chat-panel";
import { ContactPanel } from "./conversation-contact-panel";
import { ResueltosPanel } from "./resueltos-panel";
import { ResolveDialog } from "./resolve-dialog";
import { useConsulta } from "./use-consulta";
import { consultaAMensajes, agentFicha } from "./consulta-data";

export function ConsultaView({ consultaId, language, onBack, onOpenResuelto }: {
  consultaId: string;
  language: Idioma;
  onBack: () => void;
  onOpenResuelto: (id: string) => void;
}) {
  const { thread, text, setText, sending, onSend, dialogOpen, setDialogOpen, saving, onEstado, guardar, fichaCliente } = useConsulta(consultaId);
  return (
    <>
      {thread?.listoParaCerrar && !thread.resuelta ? (
        <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-foreground">
          El agente confirmo que recibio y entendio todo: <strong>listo para cerrar</strong>. Puedes cerrar esta consulta con seguridad.
        </div>
      ) : null}
      <div className="grid gap-4 mt-4 lg:grid-cols-3">
        <ChatPanel conversationId={consultaId} contactName={"Agente " + (thread?.agentSlug ?? "")} cerrado={thread?.resuelta ?? false}
          messages={consultaAMensajes(thread ?? null)} language={language} onBack={onBack}
          composerText={text} setComposerText={setText} onSend={onSend} sending={sending}
          onEstado={(s) => (s === "open" ? onBack() : onEstado(s))} resolving={saving} />
        <ContactPanel contact={fichaCliente ?? agentFicha(thread ?? null)} language={language} />
        <ResueltosPanel language={language} onOpen={onOpenResuelto} />
      </div>
      <ResolveDialog open={dialogOpen} language={language} saving={saving} onGuardar={guardar} onClose={() => setDialogOpen(false)} />
    </>
  );
}
