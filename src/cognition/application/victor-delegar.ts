/**
 * HUB by Raisen — Orquestacion de Victor: procesa los [[DELEGAR]] de su respuesta. Sin alcance = 1
 * borrador del agente REAL en Borradores (Fase 1). Con alcance = BROADCAST: resuelve la audiencia
 * (tope 25, excluye no-contactar) y genera N borradores en background (no bloquea el chat). Victor NO
 * ejecuta/envia: orquesta, delega y reporta; el dueno aprueba en Borradores. REUSA GenerateDraftHandler
 * sin modificarlo. NO toca el disparo congelado. C4 <=75. Sin any.
 */
import { detectarDelegaciones, limpiarDelegacion } from "../domain/delegacion.ts";
import { esPersonaCanonica } from "../domain/agent-draft.entity.ts";
import { resolverAudiencia } from "../infrastructure/audiencia.repo.ts";
import { generarBroadcast } from "./victor-broadcast.ts";
import type { GenerateDraftHandler } from "./generate-draft.handler.ts";
import type { TenantId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";

const CAP = 25;

export async function procesarDelegaciones(generate: GenerateDraftHandler, tenantId: string, reply: string): Promise<{ reply: string; delegados: string[] }> {
  const delegados: string[] = [];
  const wa: ChannelType = "whatsapp";
  for (const d of detectarDelegaciones(reply)) {
    if (d.agente === "victor" || !esPersonaCanonica(d.agente)) continue; // solo operativos reales
    if (d.alcance) {
      const aud = await resolverAudiencia(tenantId, d.alcance, CAP);
      if (!aud.contacts.length) { delegados.push(`${d.agente}: 0 (audiencia vacia)`); continue; }
      void generarBroadcast(generate, tenantId, d.agente, d.tarea, aud.contacts); // background: no bloquea el chat
      const extra = aud.total > aud.contacts.length ? ` de ${aud.total} (tope ${CAP})` : "";
      delegados.push(`${d.agente}: ${aud.contacts.length} borradores${extra}`);
    } else {
      const r = await generate.ejecutar({
        tenantId: tenantId as unknown as TenantId, conversationId: null, contactId: null, channel: wa, personaSlug: d.agente,
        normalizedMessage: { providerMessageId: crypto.randomUUID(), from: "victor", channel: wa, content: d.tarea, attachments: [] },
        scope: "generic", autoSendReason: "Delegado por Victor: " + d.tarea,
      });
      if (r.ok) delegados.push(d.agente);
    }
  }
  return { reply: limpiarDelegacion(reply), delegados };
}
