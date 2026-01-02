import { EventStore } from '../storage/event-store/index';
import { fullEvaluation } from '../services/full-evaluation';
import type { EngagementEvents } from '../domain/engagement/events';

describe('SeekReap Core - Full Evaluation Integration', () => {
  it('verifies a healthy human and awards credits', () => {
    const store = new EventStore();
    
    // Create single events
    const event1: EngagementEvents = { 
      type: 'VideoStarted',
      id: '1',
      occurredAt: 1000
    };
    
    const event2: EngagementEvents = { 
      type: 'VideoCompleted',
      id: '2', 
      occurredAt: 20000
    };

    // Process first event
    fullEvaluation(store, event1);
    // Process second event and get result
    const result = fullEvaluation(store, event2);
    
    expect(result.verification).toBe('Verified');
    expect(result.creditsEarned).toBeGreaterThan(0);
  });

  it('rejects a too-fast session', () => {
    const store = new EventStore();
    
    const event1: EngagementEvents = { 
      type: 'VideoStarted',
      id: '1',
      occurredAt: 1000
    };
    
    const event2: EngagementEvents = { 
      type: 'VideoCompleted',
      id: '2',
      occurredAt: 2000
    };

    // Process both events
    fullEvaluation(store, event1);
    const result = fullEvaluation(store, event2);
    
    expect(result.verification).toBe('Rejected');
    expect(result.creditsEarned).toBe(0);
  });
});
