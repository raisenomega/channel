/**
 * HUB by Raisen — D (reconexion coherente): tras RESOLVER una consulta/escalada (el humano le contesto al
 * agente), el agente vuelve al hilo del CLIENTE y genera UNA respuesta (lee el hilo + lo aprendido en
 * agent_knowledge/cerebro -> coherente, sin contradecir, empujando el cierre). `disparar` usa un autodraft
 * SIN router -> deja BORRADOR (no auto-envia): el dueno aprueba. Fire-and-forget, nunca rompe el resolve.
 * C4 <=75. Sin any.
 */
export interface ReconexionEvento {
  readonly tenantId: string; readonly conversationId: string; readonly contactId: string;
  readonly channel: string; readonly from: string; readonly content: string; readonly persona?: string;
}

export interface ReconexionPorts {
  readonly leerThread: (tenantId: string, consultaId: string) => Promise<{ conversationId: string; agentSlug: string } | null>;
  readonly datos: (convId: string) => Promise<{ from: string; channel: string; contactId: string; content: string } | null>;
  readonly disparar: (ev: ReconexionEvento) => void;
}

export async function reconectarCliente(p: ReconexionPorts, tenantId: string, consultaId: string): Promise<void> {
  try {
    const th = await p.leerThread(tenantId, consultaId);
    if (!th || !th.conversationId) return; // consulta sin cliente asociado (p.ej. duda general) -> nada que reconectar
    const d = await p.datos(th.conversationId);
    if (!d || !d.from) return; // sin destinatario -> no se puede responder al cliente
    p.disparar({
      tenantId, conversationId: th.conversationId, contactId: d.contactId, channel: d.channel, from: d.from,
      content: d.content || "El cliente quedo esperando una respuesta.", ...(th.agentSlug ? { persona: th.agentSlug } : {}),
    });
  } catch {
    /* fire-and-forget: la reconexion jamas rompe el cierre de la consulta */
  }
}
