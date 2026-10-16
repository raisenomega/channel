/**
 * HUB by Raisen — AI disclosure wording oficial (Slide 4.2b-1).
 * Wording LITERAL del doc firmado §5.4. NO MODIFICAR sin aprobacion del owner. C4 ≤75.
 */
export const AI_DISCLOSURE_TEMPLATE =
  "👋 Soy tu asistente de [TENANT_NAME]. HUB es una plataforma híbrida humano-agente — un humano revisa decisiones importantes.";

export interface DisclosureContext {
  readonly tenantName: string;
  readonly isFirstMessageOfConversation: boolean;
}

export function aplicarDisclosure(ctx: DisclosureContext): string {
  if (!ctx.isFirstMessageOfConversation) return "";
  return AI_DISCLOSURE_TEMPLATE.replace("[TENANT_NAME]", ctx.tenantName);
}

export function debeIncluirDisclosure(ctx: DisclosureContext): boolean {
  return ctx.isFirstMessageOfConversation;
}