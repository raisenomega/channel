/**
 * HUB by Raisen — Interfaz del repositorio de mensajes WhatsApp.
 * C4 ≤50 lineas.
 */
import type { Result } from "../../../shared/domain/result.ts";
import type { WhatsAppMessage } from "../domain/message.entity.ts";

export interface MessagePersistenceRepo {
  guardar(msg: WhatsAppMessage): Promise<Result<void, string>>;
  buscarPorWamid(wamid: string): Promise<Result<WhatsAppMessage | null, string>>;
  actualizarStatus(wamid: string, status: string, extra?: Record<string, string>): Promise<Result<void, string>>;
}