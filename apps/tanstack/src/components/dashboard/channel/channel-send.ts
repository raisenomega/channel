/**
 * HUB by Raisen — useChannelSend (Issue #5 / 3o-a): envía el texto del composer al endpoint real
 * POST /api/message/send (outbound, senderType human_agent) con ECHO optimista (aparece a la derecha
 * al instante). Al confirmar, refetchea el hilo; si falla, revierte el echo. La entrega real a Zernio
 * (3o-b) va aparte. C4 <=75.
 */
import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { WaMsg } from "@/components/dashboard/whatsapp-phone";

export function useChannelSend(channelId: string, activeId: string | null, contactId: string | null) {
  const qc = useQueryClient();
  const [pending, setPending] = useState<WaMsg[]>([]);
  useEffect(() => { setPending([]); }, [activeId]); // al cambiar de hilo, no arrastres echoes

  const send = useCallback(async (text: string) => {
    const body = text.trim();
    if (!activeId || !contactId || !body) return;
    const echo: WaMsg = { id: `tmp-${Date.now()}`, out: true, text: body, time: new Date().toISOString(), status: "sent" };
    setPending((p) => [...p, echo]);
    try {
      const res = await apiFetch("/api/message/send", {
        method: "POST",
        body: JSON.stringify({
          conversationId: activeId, contactId, channel: channelId, provider: "zernio",
          content: { type: "text", body }, senderType: "human_agent",
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      await qc.invalidateQueries({ queryKey: ["channel-msgs", channelId, activeId] });
      setPending((p) => p.filter((m) => m.id !== echo.id)); // el refetch ya trae el persistido
    } catch {
      setPending((p) => p.filter((m) => m.id !== echo.id)); // revierte si el envío falla
    }
  }, [activeId, contactId, channelId, qc]);

  return { send, pending };
}
