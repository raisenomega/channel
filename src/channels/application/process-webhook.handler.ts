import { Result, err } from "../../shared/domain/result.ts";
import { NormalizedMessage, ParseError, AdapterError } from "../domain/channel.adapter.ts";
import { ChannelRouter, RouterError } from "./channel.router.ts";

export interface ProcessWebhookCommand {
  readonly provider: string;
  readonly signature: string;
  readonly body: string;
  readonly rawPayload: unknown;
}

export type ProcessWebhookError =
  | ParseError
  | AdapterError
  | RouterError
  | { readonly kind: "firma_invalida" };

export class ProcessWebhookHandler {
  constructor(private readonly router: ChannelRouter) {}

  async ejecutar(cmd: ProcessWebhookCommand): Promise<Result<readonly NormalizedMessage[], ProcessWebhookError>> {
    const adapterResult = this.router.resolver(cmd.provider);
    if (!adapterResult.ok) return err(adapterResult.error);

    const adapter = adapterResult.value;
    if (!(await adapter.verifyWebhook(cmd.signature, cmd.body))) {
      return err({ kind: "firma_invalida" });
    }

    return adapter.parseInboundWebhook(cmd.rawPayload);
  }
}