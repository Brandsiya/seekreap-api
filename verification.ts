import type { EngineResult } from '../../engine/engine'

export type VerificationOutcome = 'Verified' | 'Partial' | 'Rejected'

export function determineVerification(result: EngineResult): VerificationOutcome {
  const { state, riskScore } = result

  if (state === 'completed' && riskScore < 0.5) return 'Verified'
  if (riskScore >= 0.8 || state === 'initialized') return 'Rejected'
  return 'Partial'
}
