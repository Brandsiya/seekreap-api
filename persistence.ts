import type { EngagementEvents } from '../domain/engagement/events';

export function saveEvents(events: EngagementEvents[]): void {
  // Mock implementation - just logs for testing
  console.log(`[Mock] Saving ${events.length} events`);
}

export function loadEvents(): EngagementEvents[] {
  // Mock implementation - returns empty array
  return [];
}
