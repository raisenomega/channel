import { Result, err, ok } from "../../shared/domain/result.ts";
import { TenantId } from "../../shared/domain/ids.ts";
import { IntegrationEvent, IntegrationEventType, IntegracionRepository } from "../domain/integration.entity.ts";

export type EventHandler = (event: IntegrationEvent) => Promise<Result<void, string>>;

export class EventBusService {
  private readonly handlers = new Map<string, EventHandler[]>();

  suscribir(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  async publicar(event: IntegrationEvent): Promise<Result<void, string>> {
    const handlers = this.handlers.get(event.type) ?? [];
    for (const handler of handlers) {
      const result = await handler(event);
      if (!result.ok) return err(result.error);
    }
    return ok(undefined);
  }
}

export class ProcessEcosystemEventHandler {
  constructor(
    private readonly bus: EventBusService,
    private readonly repo: IntegracionRepository,
  ) {}

  async ejecutar(event: IntegrationEvent): Promise<Result<void, string>> {
    return this.bus.publicar(event);
  }
}