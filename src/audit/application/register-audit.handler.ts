import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { AuditAction, AuditActorType, crearAuditEntry, AuditEntryError } from "../domain/audit-entry.entity.ts";
import { AuditRepository } from "../domain/audit.repository.ts";

export interface RegisterAuditCommand {
  readonly tenantId: TenantId;
  readonly action: AuditAction;
  readonly resource: string;
  readonly actorType?: AuditActorType;
  readonly actorId?: string | null;
  readonly resourceId?: string | null;
  readonly details?: Readonly<Record<string, unknown>>;
}

export type RegisterAuditError =
  | AuditEntryError
  | { readonly kind: "persistence_failure"; readonly cause: string };

type OpcionesAudit = {
  readonly actorType?: AuditActorType;
  readonly actorId?: string | null;
  readonly resourceId?: string | null;
  readonly details?: Readonly<Record<string, unknown>>;
};

type OpcionesAuditMutable = {
  actorType?: AuditActorType;
  actorId?: string | null;
  resourceId?: string | null;
  details?: Readonly<Record<string, unknown>>;
};

/** Compone opciones omitiendo propiedades vacías para respetar exactOptionalPropertyTypes. */
const construirOpciones = (cmd: RegisterAuditCommand): OpcionesAudit => {
  const opciones: OpcionesAuditMutable = {};
  if (cmd.actorType !== undefined) opciones.actorType = cmd.actorType;
  if (cmd.actorId !== undefined) opciones.actorId = cmd.actorId;
  if (cmd.resourceId !== undefined) opciones.resourceId = cmd.resourceId;
  if (cmd.details !== undefined) opciones.details = cmd.details;
  return opciones;
};

export class RegisterAuditHandler {
  constructor(private readonly auditRepo: AuditRepository) {}

  async ejecutar(cmd: RegisterAuditCommand): Promise<Result<void, RegisterAuditError>> {
    const entryResult = crearAuditEntry(
      cmd.tenantId,
      cmd.action,
      cmd.resource,
      construirOpciones(cmd),
    );
    if (!entryResult.ok) return err(entryResult.error);

    const persist = await this.auditRepo.guardar(entryResult.value);
    if (!persist.ok) {
      const cause = "cause" in persist.error ? persist.error.cause : "fallo_persistencia";
      return err({ kind: "persistence_failure", cause });
    }

    return ok(undefined);
  }
}