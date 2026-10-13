import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { ContactState } from "../domain/contact.entity.ts";
import { ContactRepository } from "../domain/contact.repository.ts";

export interface FindContactQuery {
  readonly tenantId: TenantId;
  readonly query: string;
  readonly limit: number;
}

export class FindContactHandler {
  constructor(private readonly contactRepo: ContactRepository) {}

  async ejecutar(q: FindContactQuery): Promise<Result<ContactState[], FindContactError>> {
    const porEmail = await this.contactRepo.buscarPorEmail(q.tenantId, q.query);
    if (porEmail.ok && porEmail.value) return ok([porEmail.value]);

    const fuzzy = await this.contactRepo.buscarFuzzy(q.tenantId, q.query);
    if (!fuzzy.ok) return err({ kind: "persistence_failure", cause: causaDe(fuzzy.error) });

    return ok(fuzzy.value.slice(0, q.limit));
  }
}

export type FindContactError =
  | { readonly kind: "persistence_failure"; readonly cause: string };

function causaDe(e: { readonly kind: string; readonly cause?: string }): string {
  return e.cause ?? "fallo_persistencia";
}