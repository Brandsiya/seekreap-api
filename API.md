# SeekReap Verification API

Clean, minimal API for human engagement verification.

## Core Endpoints

### 1. Append Events

Append events to an engagement. Events are stored append-only.

**Request:**
```json
{
  "events": [
    {
      "id": "evt-1",
      "type": "VideoStarted",
      "occurredAt": 1000,
      "deviceFingerprint": "device-abc123"
    },
    {
      "id": "evt-2", 
      "type": "QuestionAnswered",
      "questionId": "q1",
      "answer": "A",
      "occurredAt": 1500
    },
    {
      "id": "evt-3",
      "type": "VideoCompleted", 
      "occurredAt": 20000
    }
  ]
}

{
  "success": true,
  "engagementId": "eng-123",
  "eventsAppended": 3,
  "message": "Events appended successfully"
}

GET /engagements/:engagementId/verification

{
  "engagementId": "eng-123",
  "state": "completed",
  "riskScore": 0.2,
  "verification": "Verified",
  "totalEvents": 3,
  "evaluatedAt": "2024-01-01T10:00:00.000Z",
  "creditsAwarded": 80,
  "auditTrailId": "audit_eng-123_abc123"
}

GET /engagements/:engagementId/events

{
  "engagementId": "eng-123",
  "events": [
    {
      "id": "evt-1",
      "type": "VideoStarted",
      "occurredAt": 1000,
      "deviceFingerprint": "device-abc123"
    },
    {
      "id": "evt-2",
      "type": "QuestionAnswered",
      "questionId": "q1",
      "answer": "A",
      "occurredAt": 1500
    },
    {
      "id": "evt-3",
      "type": "VideoCompleted",
      "occurredAt": 20000
    }
  ]
}

GET /engagements/:engagementId

{
  "engagementId": "eng-123",
  "exists": true,
  "verification": {
    "engagementId": "eng-123",
    "state": "completed",
    "riskScore": 0.2,
    "verification": "Verified",
    "totalEvents": 3,
    "evaluatedAt": "2024-01-01T10:00:00.000Z",
    "creditsAwarded": 80,
    "auditTrailId": "audit_eng-123_abc123"
  },
  "eventCount": 3,
  "firstEventAt": "2024-01-01T09:59:40.000Z",
  "lastEventAt": "2024-01-01T10:00:20.000Z"
}

# Start server
npm run dev

# Append events
curl -X POST http://localhost:3000/engagements/eng-123/events \
  -H "Content-Type: application/json" \
  -d '{"events": [...]}'

# Get verification
curl http://localhost:3000/engagements/eng-123/verification

# Get event history
curl http://localhost:3000/engagements/eng-123/events


### **Step 7: Update Tests for New API**

```bash
# Update engine.test.ts with engagementId
cat > core/tests/engine.test.ts << 'EOF'
import { evaluateEngagement } from '../engine/engine';
import type { EngagementEvents } from '../domain/engagement/events';

describe('SeekReap Core - Full Evaluation Suite', () => {
  it('verifies a healthy human engagement and awards credits', () => {
    const events: EngagementEvents[] = [
      { 
        type: 'VideoStarted',
        id: '1',
        engagementId: 'eng-123',
        occurredAt: 1000
      },
      { 
        type: 'QuestionAnswered',
        id: '2',
        engagementId: 'eng-123',
        questionId: 'q1',
        answer: 'A',
        occurredAt: 5000
      },
      { 
        type: 'VideoCompleted',
        id: '3',
        engagementId: 'eng-123',
        occurredAt: 20000
      }
    ];

    const result = evaluateEngagement('eng-123', events);
    expect(result.state).toBe('completed');
    expect(result.outcome).toBe('Verified');
    expect(result.creditsAwarded).toBeGreaterThan(0);
  });

  it('rejects verification if the bot is too fast', () => {
    const events: EngagementEvents[] = [
      { 
        type: 'VideoStarted',
        id: '1',
        engagementId: 'eng-fast',
        occurredAt: 1000
      },
      { 
        type: 'VideoCompleted',
        id: '2',
        engagementId: 'eng-fast',
        occurredAt: 2000
      }
    ];

    const result = evaluateEngagement('eng-fast', events);
    expect(result.outcome).toBe('Rejected');
    expect(result.riskScore).toBeGreaterThan(0.8);
    expect(result.creditsAwarded).toBe(0);
  });

  it('maintains idempotency (same input = same output)', () => {
    const events: EngagementEvents[] = [
      { 
        type: 'VideoStarted',
        id: '1',
        engagementId: 'eng-idempotent',
        occurredAt: 1000
      }
    ];

    const resA = evaluateEngagement('eng-idempotent', events);
    const resB = evaluateEngagement('eng-idempotent', events);
    expect(resA).toEqual(resB);
  });
});
