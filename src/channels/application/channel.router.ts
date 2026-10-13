import { Result } from "../../shared/domain/result.ts";
import { ChannelAdapter, OutboundMessage, AdapterError } from "../domain/channel.adapter.ts";
import { ChannelType } from "../../shared/domain/types.ts";

export class ChannelRouter {
  private readonly adapters = new Map<string, ChannelAdapter>();

  registrar(a: ChannelAdapter): void {
    this.adapters.set(a.provider, a);
  }

  resolver(provider: string): Result<ChannelAdapter, RouterError> {
    const a = this.adapters.get(provider);
    return a
      ? { ok: true, value: a }
      : { ok: false, error: { kind: "adapter_no_registrado", provider } };
  }

  async enviar(msg: OutboundMessage): Promise<Result<void, RouterError | AdapterError>> {
    for (const a of this.adapters.values()) {
      if (a.supportedChannels.includes(msg.channel)) {
        return a.sendMessage(msg);
      }
    }
    return { ok: false, error: { kind: "canal_no_soportado", channel: msg.channel } };
  }
}

export type RouterError =
  | { readonly kind: "adapter_no_registrado"; readonly provider: string }
  | { readonly kind: "canal_no_soportado"; readonly channel: ChannelType };