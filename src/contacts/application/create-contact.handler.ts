import { Result, err, ok } from "../../shared/domain/result.ts";
import { ContactId, TenantId } from "../../shared/domain/ids.ts";
import { ContactState, ContactError, crearContacto, ContactSegment } from "../domain/contact.entity.ts";
import { ContactRepository, RepoError } from "../domain/contact.repository.ts";
import { Language } from "../../shared/domain/types.ts";

export interface CreateContactCommand {
  readonly tenantId: TenantId;
  readonly displayName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly segment?: ContactSegment;
  readonly language?: Language;
}

export type CreateContactError = ContactError | RepoError;

export class CreateContactHandler {
  constructor(private readonly contactRepo: ContactRepository) {}

  async ejecutar(cmd: CreateContactCommand): Promise<Result<ContactId, CreateContactError>> {
    const result = crearContacto(
      cmd.tenantId, cmd.displayName,
      cmd.email, cmd.phone,
      cmd.segment ?? "new_lead",
      cmd.language ?? "es",
    );
    if (!result.ok) return err(result.error);
    const guardarResult = await this.contactRepo.guardar(result.value);
    if (!guardarResult.ok) return err(guardarResult.error);
    return ok(result.value.id);
  }
}