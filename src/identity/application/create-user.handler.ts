import { Result, err, ok } from "../../shared/domain/result.ts";
import { UserState, UserCreateError, crearUser } from "../domain/user.entity.ts";
import { UserRepository, RepoError } from "../domain/identity.repository.ts";
import { Email } from "../../shared/domain/email.vo.ts";
import { Role, TenantId } from "../../shared/domain/types.ts";
import { UserId } from "../../shared/domain/ids.ts";

export interface CrearUserCommand {
  readonly email: string;
  readonly fullName: string;
  readonly role: Role;
  readonly tenantId: TenantId;
}

export type CrearUserError = UserCreateError | RepoError | { readonly kind: "email_invalido" };

export class CrearUserHandler {
  constructor(private readonly userRepo: UserRepository) {}

  async ejecutar(cmd: CrearUserCommand): Promise<Result<UserId, CrearUserError>> {
    const emailResult = Email.crear(cmd.email);
    if (!emailResult.ok) return err({ kind: "email_invalido" });

    const userResult = crearUser(emailResult.value, cmd.fullName, cmd.role, cmd.tenantId);
    if (!userResult.ok) return err(userResult.error);

    const guardarResult = await this.userRepo.guardar(userResult.value);
    if (!guardarResult.ok) return err(guardarResult.error);

    return ok(userResult.value.id);
  }
}