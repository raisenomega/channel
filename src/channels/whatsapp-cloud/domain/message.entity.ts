/**
 * HUB by Raisen — Entidad de dominio: mensaje WhatsApp.
 * VOs: phoneNumber, messageId. Usado por inbound y outbound.
 * C4 ≤75 lineas.
 */
import type { WhatsAppContent, WhatsAppContentType } from "./message-content.vo.ts";

export type MessageDirection = "inbound" | "outbound";
export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed" | "received" | "processed";

export interface WhatsAppMessage {
  readonly id: string;
  readonly tenantId: string;
  readonly wamid: string;
  readonly phoneNumberId: string;
  readonly direction: MessageDirection;
  readonly fromPhone: string;
  readonly toPhone: string;
  readonly contentType: WhatsAppContentType;
  readonly contentBody: WhatsAppContent;
  readonly status: MessageStatus;
  readonly errorCode?: string;
  readonly errorMessage?: string;
  readonly sentAt?: string;
  readonly deliveredAt?: string;
  readonly readAt?: string;
  readonly createdAt: string;
}