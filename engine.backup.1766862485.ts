import type { EngagementEvent } from '../domain/engagement/events';
import type { VerificationOutcome } from '../domain/verification/verification';

export type SessionState = 
  | 'initialized'
  | 'active'
  | 'suspended'
  | 'completed'
  | 'invalidated';

export interface EngineResult {
  sessionId: string;
  state: SessionState;
  outcome: VerificationOutcome;
  riskScore: number;
  creditsAwarded: number;
  auditTrailId: string;
  processedAt: Date;
}

export class VerificationEngine {
  private currentState: SessionState = 'initialized';
  private events: EngagementEvent[] = [];
  
  constructor(private readonly sessionId: string) {}
  
  processEvent(event: EngagementEvent): EngineResult {
    // Update state
    this.updateState(event);
    
    // Calculate risk
    const riskScore = this.calculateRisk([...this.events, event]);
    
    // Determine outcome
    const outcome = this.determineOutcome(riskScore);
    
    // Calculate credits
    const creditsAwarded = this.calculateCredits(outcome, riskScore);
    
    // Generate audit trail
    const auditTrailId = this.generateAuditTrailId();
    
    // Store event
    this.events.push(event);
    
    return {
      sessionId: this.sessionId,
      state: this.currentState,
      outcome,
      riskScore,
      creditsAwarded,
      auditTrailId,
      processedAt: new Date()
    };
  }
  
  private updateState(event: EngagementEvent): void {
    switch (event.type) {
      case 'VideoStarted':
        this.currentState = 'active';
        break;
      case 'VideoPaused':
        this.currentState = 'suspended';
        break;
      case 'VideoResumed':
        this.currentState = 'active';
        break;
      case 'VideoCompleted':
        this.currentState = 'completed';
        break;
      case 'SessionInvalidated':
        this.currentState = 'invalidated';
        break;
    }
  }
  
  private calculateRisk(events: EngagementEvent[]): number {
    const started = events.find(e => e.type === 'VideoStarted')?.payload.timestamp;
    const completed = events.find(e => e.type === 'VideoCompleted')?.payload.timestamp;
    
    if (!started || !completed) return 1;
    
    const duration = completed.getTime() - started.getTime();
    
    // Pure deterministic function
    if (duration < 5000) return 0.9;
    if (duration < 30000) return 0.7;
    if (duration < 120000) return 0.3;
    return 0.1;
  }
  
  private determineOutcome(riskScore: number): VerificationOutcome {
    if (riskScore > 0.8) {
      return {
        status: 'Rejected',
        reason: 'High risk score',
        violationCode: 'RISK_TOO_HIGH'
      };
    }
    
    return {
      status: 'Verified',
      confidence: riskScore < 0.3 ? 'High' : 'Medium',
      reason: 'Verification passed'
    };
  }
  
  private calculateCredits(outcome: VerificationOutcome, riskScore: number): number {
    if (outcome.status === 'Rejected') return 0;
    return Math.max(0, 100 - Math.floor(100 * riskScore));
  }
  
  private generateAuditTrailId(): string {
    const eventHash = this.events
      .map(e => `${e.type}:${e.payload.timestamp.getTime()}`)
      .join('|');
    
    return `audit_${this.sessionId}_${Buffer.from(eventHash).toString('base64').slice(0, 16)}`;
  }
  
  static reconstruct(sessionId: string, events: EngagementEvent[]): EngineResult {
    const engine = new VerificationEngine(sessionId);
    let lastResult: EngineResult | null = null;
    
    events.forEach(event => {
      lastResult = engine.processEvent(event);
    });
    
    return lastResult || {
      sessionId,
      state: 'initialized',
      outcome: { status: 'Pending' },
      riskScore: 1,
      creditsAwarded: 0,
      auditTrailId: `audit_${sessionId}_empty`,
      processedAt: new Date()
    };
  }
}
