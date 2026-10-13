import { Result, err, ok } from "../../shared/domain/result.ts";
import { ContactId, TenantId } from "../../shared/domain/ids.ts";
import { registrarConsent, ConsentRecord, ConsentAction, ConsentSource, ChannelType } from "../domain/compliance.entity.ts";
import { ConsentRepository, RepoError } from "../domain/compliance.repository.ts";

export type OptInError = RepoError | { readonly kind: "ya_opt_in" };

export class OptInHandler {
  constructor(private readonly consentRepo: ConsentRepository) {}

  async ejecutar(
    contactId: ContactId,
    tenantId: TenantId,
    channel: ChannelType,
    source: ConsentSource,
  ): Promise<Result<void, OptInError>> {
    const ultimo = await this.consentRepo.buscarUltimo(tenantId, contactId, channel);
    if (ultimo.ok && ultimo.value?.action === "opt_in") {
      return err({ kind: "ya_opt_in" });
    }
    const record = registrarConsent(contactId, tenantId, channel, "opt_in", source);
    const guardado = await this.consentRepo.guardar(record);
    if (!guardado.ok) return err(guardado.error);
    return ok(undefined);
  }
}

export class OptOutHandler {
  constructor(private readonly consentRepo: ConsentRepository) {}

  async ejecutar(contactId: ContactId, tenantId: TenantId, channel: ChannelType): Promise<Result<void, OptInError>> {
    const record = registrarConsent(contactId, tenantId, channel, "opt_out", "explicit");
    const guardado = await this.consentRepo.guardar(record);
    if (!guardado.ok) return err(guardado.error);
    return ok(undefined);
  }
}