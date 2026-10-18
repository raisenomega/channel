import { Result, err, ok } from "../../shared/domain/result.ts";
import { UserId, TenantId } from "../../shared/domain/ids.ts";
import { Role } from "../../shared/domain/types.ts";
import { Email } from "../../shared/domain/email.vo.ts";
import { Language } from "../../shared/domain/locale.vo.ts";

export interface UserState {
  readonly id: UserId;
  readonly tenantId: TenantId;
  readonly email: Email;
  readonly fullName: string;
  readonly role: Role;
  readonly language: Language;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

export type UserCreateError =
  | { readonly kind: "email_invalido" }
  | { readonly kind: "rol_invalido" }
  | { readonly kind: "tenant_requerido" }
  | { readonly kind: "idioma_invalido" };

export const crearUser = (
  email: Email,
  fullName: string,
  role: Role,
  tenantId: TenantId,
  language: Language = "es",
  id?: UserId,
): Result<UserState, UserCreateError> => {
  const roles: readonly Role[] = ["owner", "admin", "supervisor", "agent", "viewer", "superadmin", "buyer"];
  if (!roles.includes(role)) {
    return err({ kind: "rol_invalido" });
  }
  const langs: readonly string[] = ["es", "en"];
  if (!langs.includes(language)) {
    return err({ kind: "idioma_invalido" });
  }
  const state: UserState = Object.freeze({
    id: id ?? (crypto.randomUUID() as UserId),
    tenantId,
    email,
    fullName: fullName.trim(),
    role,
    language,
    isActive: true,
    createdAt: new Date(),
  });
  return ok(state);
};