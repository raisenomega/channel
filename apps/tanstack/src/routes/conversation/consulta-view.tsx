/**
 * HUB by Raisen — Vista del scope AGENTE (consulta). MISMO layout y componentes que la conversacion
 * del cliente (ChatPanel | ContactPanel/Ficha 360 | ResueltosPanel); solo cambia el scope: el chat es
 * el hilo con el AGENTE (su pregunta) y el envio del dueno es la respuesta -> resolved + agent_knowledge
 * (todos los agentes la citan) y aterriza en Tickets Resueltos. C4 <=75.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { ChatPanel } from "./conversation-chat-panel";
import { ContactPanel } from "./conversation-contact-panel";
import { ResueltosPanel } from "./resueltos-panel";
import { fetchConsultaThread, responderConsulta, consultaAMensajes, agentFicha } from "./consulta-data";

export function ConsultaView({ consultaId, language, onBack, onOpenResuelto }: {
  consultaId: string;
  language: Idioma;
  onBack: () => void;
  onOpenResuelto: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const { data: thread } = useQuery({ queryKey: ["consulta", consultaId], queryFn: () => fetchConsultaThread(consultaId), staleTime: 5_000 });

  async function handleSend() {
    const r = text.trim();
    if (!r || sending || !thread) return;
    setSending(true);
    const ok = await responderConsulta(consultaId, thread.agentSlug, thread.pregunta, r);
    if (ok) {
      setText("");
      void qc.invalidateQueries({ queryKey: ["consulta", consultaId] });
      void qc.invalidateQueries({ queryKey: ["tickets-resueltos"] });
    }
    setSending(false);
  }

  return (
    <div className="grid gap-4 mt-4 lg:grid-cols-3">
      <ChatPanel conversationId={consultaId} contactName={"Agente " + (thread?.agentSlug ?? "")}
        messages={consultaAMensajes(thread ?? null)} language={language} onBack={onBack}
        composerText={text} setComposerText={setText} onSend={handleSend} sending={sending}
        onEstado={() => { /* el envio ES la respuesta/resolucion */ }} resolving={false} scope="agente" />
      <ContactPanel contact={agentFicha(thread ?? null)} language={language} />
      <ResueltosPanel language={language} onOpen={onOpenResuelto} />
    </div>
  );
}
