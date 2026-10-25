/**
 * HUB by Raisen — Parte B: al entrar un mensaje, captura los datos base del cliente del hilo y los guarda en
 * el contacto (solo campos vacios). Asi, cuando llegue la cotizacion, el agente YA tiene los datos correctos.
 * Fire-and-forget: nunca rompe el inbound. C4 <=75. Sin any.
 */
import type { AutodraftEvent } from "./maybe-autodraft.service.ts";
import type { ContactDataProducer } from "./contact-data.producer.ts";
import type { ThreadMsg } from "./closing-draft.producer.ts";
import type { ExtractedData } from "../domain/contact-data.ts";

export class MaybeCaptureService {
  constructor(
    private readonly producer: ContactDataProducer,
    private readonly leerHilo: (conversationId: string) => Promise<readonly ThreadMsg[]>,
    private readonly guardar: (contactId: string, d: ExtractedData) => Promise<string[]>,
  ) {}

  async ejecutar(ev: AutodraftEvent): Promise<void> {
    try {
      if (!ev.contactId || !ev.conversationId) return;
      const hilo = await this.leerHilo(String(ev.conversationId));
      const d = await this.producer.extraer(hilo);
      const llenados = await this.guardar(String(ev.contactId), d);
      if (llenados.length) console.error(`[capture] contacto=${ev.contactId} guardo: ${llenados.join(", ")}`);
    } catch (e) { console.error(`[capture] ERROR`, e instanceof Error ? e.message : e); }
  }
}
