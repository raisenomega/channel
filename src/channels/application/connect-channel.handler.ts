import { Result, err, ok } from "../../shared/domain/result.ts";
import { InboxId, TenantId } from "../../shared/domain/ids.ts";
import { ChannelType } from "../../shared/domain/types.ts";
import { ProviderType, InboxCreateError, crearInbox, activarInbox } from "../domain/inbox.entity.ts";
import { InboxRepository, RepoError } from "../domain/channels.repository.ts";

export interface ConnectChannelCommand {
  readonly tenantId: TenantId;
  readonly name: string;
  readonly channelType: ChannelType;
  readonly provider: ProviderType;
}

export type ConnectChannelError = InboxCreateError | RepoError;

export class ConnectChannelHandler {
  constructor(private readonly inboxRepo: InboxRepository) {}

  async ejecutar(cmd: ConnectChannelCommand): Promise<Result<InboxId, ConnectChannelError>> {
    const inboxResult = crearInbox(cmd.name, cmd.channelType, cmd.provider, cmd.tenantId);
    if (!inboxResult.ok) return err(inboxResult.error);

    const inboxActivo = activarInbox(inboxResult.value);
    const guardarResult = await this.inboxRepo.guardar(inboxActivo);
    if (!guardarResult.ok) return err(guardarResult.error);

    return ok(inboxActivo.id);
  }
}