/**
 * HUB by Raisen — UUID DETERMINISTA (SHA-256 del seed -> formato uuid). Mismo seed -> mismo id, para
 * idempotencia del ingest (contacto/conversación de un mismo remitente no se duplican). C4 <=75.
 */
import { createHash } from "node:crypto";

export function detUuid(seed: string): string {
  const h = createHash("sha256").update(seed).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}
