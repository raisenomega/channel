/**
 * HUB by Raisen — Hook del scope AGENTE: mismo flujo que el cliente. El composer agrega mensajes al
 * hilo (seguir); [Solucionado] abre el modal de firma; [Guardar] cierra -> resolved + agent_knowledge
 * y aterriza en Tickets Resueltos. Reabrir el hilo desde Resueltos permite seguir. C4 <=75.
 */
import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { readLocalSession } from "@/lib/auth";
import type { Contact360 } from "@/lib/types";
import { resolveContact360 } from "./conversation-resolver";
import { fetchConsultaThread, agregarMensajeConsulta, resolverConsulta } from "./consulta-data";

export function useConsulta(consultaId: string) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const enviandoRef = useRef(false); // guard SINCRONO anti doble-submit
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fichaCliente, setFichaCliente] = useState<Contact360 | null>(null); // escalada/consulta ligada a cliente -> su Ficha360
  const { data: thread } = useQuery({ queryKey: ["consulta", consultaId], queryFn: () => fetchConsultaThread(consultaId), staleTime: 5_000 });
  const convId = thread?.conversationId ?? "";
  useEffect(() => { if (!convId) { setFichaCliente(null); return; } void resolveContact360(convId).then((c) => setFichaCliente(c ?? null)); }, [convId]);
  const refrescar = () => { void qc.invalidateQueries({ queryKey: ["consulta", consultaId] }); void qc.invalidateQueries({ queryKey: ["tickets-resueltos"] }); };

  async function onSend(): Promise<void> {
    const txt = text.trim();
    if (!txt || enviandoRef.current) return;
    enviandoRef.current = true; setSending(true);
    const ok = await agregarMensajeConsulta(consultaId, txt);
    if (ok) { setText(""); refrescar(); }
    setSending(false); enviandoRef.current = false;
  }

  function onEstado(s: "resolved" | "open"): void { if (s === "resolved") setDialogOpen(true); }

  async function guardar(atendio: string, nota: string): Promise<void> {
    if (!thread) return;
    setSaving(true);
    const ok = await resolverConsulta(consultaId, thread.agentSlug, thread.pregunta, nota, atendio || readLocalSession()?.user?.email || "");
    if (ok) { setDialogOpen(false); refrescar(); }
    setSaving(false);
  }

  return { thread, text, setText, sending, onSend, dialogOpen, setDialogOpen, saving, onEstado, guardar, fichaCliente };
}
