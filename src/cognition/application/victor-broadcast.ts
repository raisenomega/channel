/**
 * HUB by Raisen — Fan-out del broadcast delegado por Victor: por cada contacto de la audiencia, el agente
 * REAL genera un borrador (REUSO de GenerateDraftHandler, no lo modifica) que cae en Borradores. NO envia
 * nada (el dueno aprueba cada uno). Best-effort por contacto (un fallo no corta el resto). Se corre en
 * background desde la ruta de Victor para no bloquear el chat. C4 <=75. Sin any.
 */
import type { GenerateDraftHandler } from "./generate-draft.handler.ts";
import type { Destinatario } from "../infrastructure/audiencia.repo.ts";
import type { TenantId, ContactId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";

export async function generarBroadcast(generate: GenerateDraftHandler, tenantId: string, agente: string, tarea: string, contacts: Destinatario[]): Promise<void> {
  const wa: ChannelType = "whatsapp";
  for (const c of contacts) {
    try {
      await generate.ejecutar({
        tenantId: tenantId as unknown as TenantId, conversationId: null, contactId: c.contactId as unknown as ContactId,
        channel: wa, personaSlug: agente,
        normalizedMessage: { providerMessageId: crypto.randomUUID(), from: c.phone, channel: wa, content: tarea, attachments: [] },
        contactName: c.name, contactPhone: c.phone, scope: "generic", autoSendReason: "Broadcast delegado por Victor: " + tarea,
      });
    } catch {
      /* best-effort: un contacto que falle no corta el broadcast */
    }
  }
}
