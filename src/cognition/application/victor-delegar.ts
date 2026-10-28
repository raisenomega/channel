/**
 * HUB by Raisen — Orquestacion de Victor: procesa los marcadores [[DELEGAR]] de su respuesta, crea el
 * borrador del agente REAL (via GenerateDraftHandler, REUSO: no lo modifica) en Borradores, y devuelve el
 * texto limpio + a quienes delego (para el reporte). Victor NO ejecuta: orquesta, delega y reporta. Nada
 * se envia aqui; el dueno aprueba en Borradores. C4 <=75. Sin any.
 */
import { detectarDelegaciones, limpiarDelegacion } from "../domain/delegacion.ts";
import { esPersonaCanonica } from "../domain/agent-draft.entity.ts";
import type { GenerateDraftHandler } from "./generate-draft.handler.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";

export async function procesarDelegaciones(generate: GenerateDraftHandler, tenantId: string, reply: string): Promise<{ reply: string; delegados: string[] }> {
  const delegados: string[] = [];
  const wa: ChannelType = "whatsapp";
  for (const d of detectarDelegaciones(reply)) {
    if (d.agente === "victor" || !esPersonaCanonica(d.agente)) continue; // solo operativos reales
    const r = await generate.ejecutar({
      tenantId: tenantId as unknown as TenantId,
      conversationId: null, contactId: null, channel: wa, personaSlug: d.agente,
      normalizedMessage: { providerMessageId: crypto.randomUUID(), from: "victor", channel: wa, content: d.tarea, attachments: [] },
      scope: "generic", autoSendReason: "Delegado por Victor: " + d.tarea,
    });
    if (r.ok) delegados.push(d.agente);
  }
  return { reply: limpiarDelegacion(reply), delegados };
}
