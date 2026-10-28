/**
 * HUB by Raisen — Fan-out del broadcast delegado por Victor. El agente REAL redacta el mensaje UNA vez
 * (1 LLM via GenerateDraftHandler, reuso) y se CLONA a N borradores (uno por contacto) via
 * PersistDraftHandler: barato, rapido, AWAITED (sin promesa en background que no corria) y coherente
 * (mismo mensaje a toda la audiencia). NO envia (el dueno aprueba cada uno). Devuelve cuantos se crearon.
 * NO toca el disparo congelado. C4 <=75. Sin any.
 */
import type { GenerateDraftHandler } from "./generate-draft.handler.ts";
import type { PersistDraftHandler } from "./persist-draft.handler.ts";
import type { Destinatario } from "../infrastructure/audiencia.repo.ts";
import type { TenantId, ContactId } from "../../shared/domain/ids.ts";
import type { ChannelType } from "../../shared/domain/types.ts";

const WA: ChannelType = "whatsapp";

export async function generarBroadcast(generate: GenerateDraftHandler, persist: PersistDraftHandler, tenantId: string, agente: string, tarea: string, contacts: Destinatario[]): Promise<number> {
  const f = contacts[0];
  if (!f) return 0;
  const r0 = await generate.ejecutar({
    tenantId: tenantId as unknown as TenantId, conversationId: null, contactId: f.contactId as unknown as ContactId,
    channel: WA, personaSlug: agente,
    normalizedMessage: { providerMessageId: crypto.randomUUID(), from: f.phone, channel: WA, content: tarea, attachments: [] },
    contactName: f.name, contactPhone: f.phone, scope: "generic", autoSendReason: "Broadcast delegado por Victor: " + tarea,
  });
  if (!r0.ok) { console.error(`[broadcast] ${agente} generate fallo: ${r0.error.kind}`); return 0; }
  const contenido = r0.value.draftContent;
  let n = 1;
  for (const c of contacts.slice(1)) {
    const p = await persist.ejecutar({
      tenantId: tenantId as unknown as TenantId, conversationId: null, contactId: c.contactId as unknown as ContactId,
      personaSlug: agente, inboundMessage: tarea, draftContent: contenido, confidence: 0.5,
      reason: "Broadcast delegado por Victor", aiDisclosureIncluded: false, traceId: crypto.randomUUID(),
      to: c.phone, channel: WA, contactName: c.name, contactPhone: c.phone, scope: "generic",
    });
    if (p.ok) n++;
  }
  console.error(`[broadcast] ${agente} -> ${n}/${contacts.length} borradores`);
  return n;
}
