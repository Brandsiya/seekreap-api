import { evaluateEngagement } from '../engine/engine';
import type { EngagementEvents } from '../domain/engagement/events';

describe('SeekReap Core - Full Evaluation Suite', () => {
  it('verifies a healthy human engagement and awards credits', () => {
    const events: EngagementEvents[] = [
      { 
        type: 'VideoStarted',
        id: '1',
        occurredAt: 1000
      },
      { 
        type: 'QuestionAnswered',
        id: '2',
        questionId: 'q1',
        answer: 'A',
        occurredAt: 5000
      },
      { 
        type: 'VideoCompleted',
        id: '3',
        occurredAt: 20000
      }
    ];

    const result = evaluateEngagement('test-123', events);
    expect(result.state).toBe('completed');
    expect(result.outcome).toBe('Verified');
    expect(result.creditsAwarded).toBeGreaterThan(0);
  });

  it('rejects verification if the bot is too fast', () => {
    const events: EngagementEvents[] = [
      { 
        type: 'VideoStarted',
        id: '1',
        occurredAt: 1000
      },
      { 
        type: 'VideoCompleted',
        id: '2',
        occurredAt: 2000
      }
    ];

    const result = evaluateEngagement('test-fast', events);
    expect(result.outcome).toBe('Rejected');
    expect(result.riskScore).toBeGreaterThan(0.8);
    expect(result.creditsAwarded).toBe(0);
  });

  it('maintains idempotency (same input = same output)', () => {
    const events: EngagementEvents[] = [
      { 
        type: 'VideoStarted',
        id: '1',
        occurredAt: 1000
      }
    ];

    const resA = evaluateEngagement('test-idempotent', events);
    const resB = evaluateEngagement('test-idempotent', events);
    expect(resA).toEqual(resB);
  });
});
