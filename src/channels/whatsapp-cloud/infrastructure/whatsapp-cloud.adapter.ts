/**
 * HUB by Raisen — Adapter WhatsApp Cloud API (DDD hexagonal).
 * Integrado con Slice 1: resuelve token real del tenant desde signup_tokens.
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../../shared/domain/result.ts";
import type { WhatsAppAdapterPort, SentMessage } from "../domain/whatsapp-adapter.port.ts";
import type { WhatsAppContent } from "../domain/message-content.vo.ts";
import { WhatsAppCloudApiClient } from "./whatsapp-cloud-api.client.ts";
import { SupabaseMetaSignupFacade } from "../../meta/infrastructure/meta-signup-facade.ts";

export class WhatsAppCloudAdapter implements WhatsAppAdapterPort {
  private api = new WhatsAppCloudApiClient();
  private signupRepo: SupabaseMetaSignupFacade;

  constructor(signupRepo?: SupabaseMetaSignupFacade) {
    this.signupRepo = signupRepo ?? new SupabaseMetaSignupFacade();
  }

  async enviarMensaje(tenantId: string, fromPhoneNumberId: string, toPhone: string, content: WhatsAppContent): Promise<Result<SentMessage, string>> {
    const tokenRes = await this.buscarToken(tenantId);
    if (!tokenRes.ok) return tokenRes;
    const result = await this.api.enviar(toPhone, content, tokenRes.value, fromPhoneNumberId);
    if (!result.ok) return err(result.error);
    return ok({ wamid: result.value.wamid, status: "sent" });
  }

  // CRIT-S2-D: marcarLeido ahora recibe tenantId
  async marcarLeido(tenantId: string, phoneNumberId: string, messageId: string): Promise<Result<void, string>> {
    const tokenRes = await this.buscarToken(tenantId);
    if (!tokenRes.ok) return tokenRes;
    return this.api.marcarLeido(messageId, tokenRes.value, phoneNumberId);
  }

  private async buscarToken(tenantId: string): Promise<Result<string, string>> {
    // 1. Encontrar signup activo del tenant (status COMPLETED)
    const signupRes = await this.signupRepo.buscarPorTenant(tenantId);
    if (!signupRes.ok || !signupRes.value) return err("sin_signup_activo");
    // 2. Obtener token desencriptado
    return await this.signupRepo.obtenerTokenPlano(signupRes.value.id);
  }
}