/**
 * HUB by Raisen — Helpers de rutas de mensajeria (FORTRESS N-5/N-6). Mantiene los
 * handlers <=75: construccion de MessageContent + validacion contacto-pertenece-al-tenant.
 */
import type { MessageContent } from "../inbox/domain/message.entity.ts";
import type { HttpResponse } from "./server-types.ts";
import type { ServerHandlers } from "./server-routes.ts";
import { contentType } from "./server-helpers.ts";
import { jsonResponse } from "./auth-helpers.ts";
import type { ContactId, TenantId } from "../shared/domain/ids.ts";

export function buildContent(b: Record<string, unknown>): MessageContent {
  const c = b["content"] as Record<string, unknown> | undefined;
  return { type: contentType(c?.["type"] as string | null), body: (c?.["body"] as string) ?? "" };
}

// N-5: el contacto debe existir y pertenecer al tenant del claim; si no -> 404 contact_not_found.
export async function validarContactoTenant(h: ServerHandlers, contactId: ContactId, tenantId: TenantId): Promise<HttpResponse | null> {
  const contact = await h.contactsRepo.buscar(contactId);
  if (!contact.ok || !contact.value || contact.value.tenantId !== tenantId) {
    return jsonResponse(404, { ok: false, error: { kind: "contact_not_found" } });
  }
  return null;
}
