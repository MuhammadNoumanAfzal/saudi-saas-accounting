export type DomainEvent<TPayload = Record<string, unknown>> = {
  id: string;
  name: string;
  occurredAt: string;
  organizationId?: string;
  aggregateType?: string;
  aggregateId?: string;
  payload: TPayload;
};

export type DomainEventHandler<
  TEvent extends DomainEvent = DomainEvent,
> = (event: TEvent) => void | Promise<void>;

export class InProcessDomainEventBus {
  private readonly handlers = new Map<
    string,
    Set<DomainEventHandler>
  >();

  subscribe<TEvent extends DomainEvent>(
    eventName: TEvent["name"],
    handler: DomainEventHandler<TEvent>,
  ) {
    const handlers =
      this.handlers.get(eventName) ?? new Set<DomainEventHandler>();
    handlers.add(handler as DomainEventHandler);
    this.handlers.set(eventName, handlers);

    return () => {
      handlers.delete(handler as DomainEventHandler);
      if (!handlers.size) this.handlers.delete(eventName);
    };
  }

  async publish<TEvent extends DomainEvent>(event: TEvent) {
    const handlers = this.handlers.get(event.name);
    if (!handlers?.size) return;
    await Promise.all([...handlers].map((handler) => handler(event)));
  }
}