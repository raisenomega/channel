/**
 * HUB by Raisen — Hook de resolucion del ticket (mantiene C4 de ConversationPage). [Solucionado] abre el
 * dialogo; [Guardar] resuelve con "quien atendio" y refresca el panel de resueltos SIN salir de la pagina.
 * [Mantener abierto] -> status=open directo. C4 <=75.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cambiarEstadoTicket } from "./conversation-resolve";

export function useResolve(conversationId: string) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onEstado(status: "resolved" | "open"): Promise<void> {
    if (status === "resolved") { setDialogOpen(true); return; }
    await cambiarEstadoTicket(conversationId, "open");
  }

  async function guardar(atendio: string, nota: string): Promise<void> {
    setSaving(true);
    const ok = await cambiarEstadoTicket(conversationId, "resolved", atendio, nota);
    if (ok) { setDialogOpen(false); void qc.invalidateQueries({ queryKey: ["tickets-resueltos"] }); }
    setSaving(false);
  }

  return { dialogOpen, setDialogOpen, saving, onEstado, guardar };
}
