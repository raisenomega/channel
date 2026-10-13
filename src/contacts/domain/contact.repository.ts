import { Result } from "../../shared/domain/result.ts";
import { ContactId, TenantId } from "../../shared/domain/ids.ts";
import { ChannelType } from "../../shared/domain/types.ts";
import { ContactState } from "./contact.entity.ts";

export interface ContactChannelState {
  readonly contactId: ContactId;
  readonly channelType: ChannelType;
  readonly identifier: string;
  readonly isVerified: boolean;
  readonly isPrimary: boolean;
}

export type ContactChannelError = { readonly kind: "identificador_vacio" };

export const crearContactChannel = (
  contactId: ContactId,
  channelType: ChannelType,
  identifier: string,
  isPrimary = false,
): Result<ContactChannelState, ContactChannelError> => {
  if (!identifier || identifier.trim().length === 0) {
    return { ok: false, error: { kind: "identificador_vacio" } };
  }
  return { ok: true, value: Object.freeze({
    contactId, channelType,
    identifier: identifier.trim(),
    isVerified: false,
    isPrimary,
  })};
};

export interface ContactNoteState {
  readonly contactId: ContactId;
  readonly authorId: string;
  readonly note: string;
  readonly createdAt: Date;
}

export interface ContactRepository {
  guardar(contact: ContactState): Promise<Result<void, RepoError>>;
  buscar(id: ContactId): Promise<Result<ContactState | null, RepoError>>;
  buscarPorTenant(tenantId: TenantId): Promise<Result<ContactState[], RepoError>>;
  buscarPorEmail(tenantId: TenantId, email: string): Promise<Result<ContactState | null, RepoError>>;
  buscarFuzzy(tenantId: TenantId, query: string): Promise<Result<ContactState[], RepoError>>;
}

export type RepoError =
  | { readonly kind: "not_found" }
  | { readonly kind: "duplicado" }
  | { readonly kind: "persistence_failure"; readonly cause: string };