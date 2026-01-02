import { EventStore } from '../storage/event-store/index';
import { evaluateEngagement, type EngineResult } from '../engine/engine';
import { determineVerification, type VerificationOutcome } from '../domain/verification/verification';
import type { EngagementEvents } from '../domain/engagement/events';
import { saveEvents } from '../storage/persistence';

export type FullEvaluationResult = Readonly<{
  state: string;
  totalEvents: number;
  riskScore: number;
  verification: VerificationOutcome;
  creditsEarned: number;
}>;

export function fullEvaluation(store: EventStore, newEvent: EngagementEvents): FullEvaluationResult {
  store.append(newEvent);
  saveEvents(store.getAll());
  
  const engineResult = evaluateEngagement('session-id', store.getAll());
  
  return { 
    state: engineResult.state,
    totalEvents: store.getAll().length,
    riskScore: engineResult.riskScore,
    verification: determineVerification(engineResult),
    creditsEarned: engineResult.creditsAwarded
  };
}
