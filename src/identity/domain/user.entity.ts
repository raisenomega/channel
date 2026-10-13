import { Result, err, ok } from "../../shared/domain/result.ts";
import { UserId, TenantId } from "../../shared/domain/ids.ts";
import { Role } from "../../shared/domain/types.ts";
import { Email } from "../../shared/domain/email.vo.ts";

export interface UserState {
  readonly id: UserId;
  readonly tenantId: TenantId;
  readonly email: Email;
  readonly fullName: string;
  readonly role: Role;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

export type UserCreateError =
  | { readonly kind: "email_invalido" }
  | { readonly kind: "rol_invalido" }
  | { readonly kind: "tenant_requerido" };

export const crearUser = (
  email: Email,
  fullName: string,
  role: Role,
  tenantId: TenantId,
): Result<UserState, UserCreateError> => {
  const roles: readonly Role[] = ["owner", "admin", "supervisor", "agent", "viewer", "superadmin"];
  if (!roles.includes(role)) {
    return err({ kind: "rol_invalido" });
  }
  const state: UserState = Object.freeze({
    id: crypto.randomUUID() as UserId,
    tenantId,
    email,
    fullName: fullName.trim(),
    role,
    isActive: true,
    createdAt: new Date(),
  });
  return ok(state);
};