import type { EngagementEvents } from '../domain/engagement/events';
import type { VerificationOutcome } from '../domain/verification/verification';

export type SessionState = 
  | 'initialized'
  | 'active'
  | 'suspended'
  | 'completed'
  | 'invalidated';

export interface EngineResult {
  engagementId: string;
  state: SessionState;
  outcome: VerificationOutcome;
  riskScore: number;
  creditsAwarded: number;
  auditTrailId: string;
  processedAt: Date;
}

export class VerificationEngine {
  private currentState: SessionState = 'initialized';
  private events: EngagementEvents[] = [];
  
  constructor(private readonly engagementId: string) {}

  processEvent(event: EngagementEvents): EngineResult {
    this.updateState(event);
    const riskScore = this.calculateRisk([...this.events, event]);
    const outcome = this.determineOutcome(riskScore);
    const creditsAwarded = this.calculateCredit(outcome, riskScore);
    const auditTrailId = this.generateAuditTrailId();
    this.events.push(event);

    return {
      engagementId: this.engagementId,
      state: this.currentState,
      outcome,
      riskScore,
      creditsAwarded,
      auditTrailId,
      processedAt: new Date()
    };
  }

  private updateState(event: EngagementEvents): void {
    switch (event.type) {
      case 'VideoStarted': this.currentState = 'active'; break;
      case 'VideoPaused': this.currentState = 'suspended'; break;
      case 'VideoResumed': this.currentState = 'active'; break;
      case 'VideoCompleted': this.currentState = 'completed'; break;
    }
  }

  private calculateRisk(events: EngagementEvents[]): number {
    const started = events.find(e => e.type === 'VideoStarted');
    const completed = events.find(e => e.type === 'VideoCompleted');

    if (!started || !completed) return 1.0;

    const duration = completed.occurredAt - started.occurredAt;

    if (duration < 3000) return 0.9;
    if (duration < 10000) return 0.7;
    if (duration < 30000) return 0.2;
    if (duration < 120000) return 0.1;
    return 0.05;
  }

  private determineOutcome(riskScore: number): VerificationOutcome {
    if (riskScore > 0.8) return 'Rejected';
    if (riskScore < 0.3) return 'Verified';
    return 'Partial';
  }

  private calculateCredit(outcome: VerificationOutcome, riskScore: number): number {
    if (outcome === 'Rejected') return 0;
    if (outcome === 'Partial') return Math.max(0, 50 - Math.floor(50 * riskScore));
    return Math.max(0, 100 - Math.floor(100 * riskScore));
  }

  private generateAuditTrailId(): string {
    if (this.events.length === 0) {
      return `audit_${this.engagementId}_empty`;
    }
    
    const eventHash = this.events
      .map(e => `${e.type}:${e.occurredAt}:${e.id}`)
      .join('!');
    
    const hash = Buffer.from(eventHash).toString('base64').slice(0, 16);
    return `audit_${this.engagementId}_${hash}`;
  }

  static reconstruct(engagementId: string, events: EngagementEvents[]): EngineResult {
    const engine = new VerificationEngine(engagementId);
    let lastResult: EngineResult | null = null;
    
    events.forEach(event => {
      lastResult = engine.processEvent(event);
    });

    return lastResult || {
      engagementId,
      state: 'initialized',
      outcome: 'Rejected',
      riskScore: 1.0,
      creditsAwarded: 0,
      auditTrailId: `audit_${engagementId}_empty`,
      processedAt: new Date()
    };
  }

  getCurrentState(): SessionState { return this.currentState; }
  getEventCount(): number { return this.events.length; }
}

export const evaluateEngagement = VerificationEngine.reconstruct;
