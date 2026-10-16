/**
 * HUB by Raisen — Entidad de draft supervisado del agente (Slide 4.2b-1).
 * Persiste decisiones hold_for_human_review con metadata completo. C4 ≤75.
 */
import type { TenantId, ConversationId, ContactId } from "../../shared/domain/ids.ts";

export type DraftStatus = "draft" | "approved" | "rejected" | "sent" | "expired";

export interface AgentDraft {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly conversationId: ConversationId;
  readonly contactId: ContactId;
  readonly personaSlug: string;
  readonly inboundMessage: string;
  readonly draftContent: string;
  readonly confidence: number;
  readonly reason: string;
  readonly status: DraftStatus;
  readonly aiDisclosureIncluded: boolean;
  readonly traceId: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
  readonly updatedAt: string;
  // Columnas de aprobacion (Slide 4.2b-2)
  readonly approvedBy: string | null;
  readonly approvedAt: string | null;
  readonly rejectedReason: string | null;
  readonly sentAt: string | null;
  readonly providerMessageId: string | null;
  readonly wasCorrect: boolean | null;
  readonly feedbackNote: string | null;
}

export const CANONICAL_PERSONA_SLUGS: ReadonlyArray<string> = Object.freeze(
  ["victor", "zahra", "thao", "iris", "eco", "angel", "kelsy"] as const,
);

export function esPersonaCanonica(slug: string): boolean {
  return (CANONICAL_PERSONA_SLUGS as readonly string[]).includes(slug);
}