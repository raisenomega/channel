/**
 * HUB by Raisen — Tipos de mensaje.
 */

export interface Mensaje {
  readonly id: string;
  readonly conversationId: string;
  readonly senderType: "contact" | "agent" | "system";
  readonly senderId: string | null;
  readonly content: string;
  readonly messageType: string;
  readonly createdAt: string;
}