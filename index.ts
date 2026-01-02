import type { EngagementEvents } from '../../domain/engagement/events';

export class EventStore {
  private events: EngagementEvents[] = [];

  append(event: EngagementEvents): void {
    this.events.push(event);
  }

  getAll(): EngagementEvents[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }

  get count(): number {
    return this.events.length;
  }
}
