import { EngagementEvent } from './types'

// Discriminated union of all valid SeekReap engagement events
// Each event has a fixed 'type' and a timestamp 'occurredAt'
// This ensures deterministic, type-safe processing

export type EngagementEvents =
  | VideoStartedEvent
  | VideoCompletedEvent
  | QuestionAnsweredEvent
  | VideoPausedEvent
  | VideoResumedEvent

export type VideoStartedEvent = Readonly<{
  type: 'VideoStarted'
  id: string
  occurredAt: number
  engagementId: string
  deviceFingerprint?: string
}>

export type VideoCompletedEvent = Readonly<{
  type: 'VideoCompleted'
  id: string
  occurredAt: number
  engagementId: string
}>

export type QuestionAnsweredEvent = Readonly<{
  type: 'QuestionAnswered'
  id: string
  engagementId: string
  questionId: string
  answer: string
  occurredAt: number
}>

export type VideoPausedEvent = Readonly<{
  type: 'VideoPaused'
  id: string
  engagementId: string
  occurredAt: number
}>

export type VideoResumedEvent = Readonly<{
  type: 'VideoResumed'
  id: string
  engagementId: string
  occurredAt: number
}>

// Helper type guards
export function isVideoStarted(event: EngagementEvents): event is VideoStartedEvent {
  return event.type === 'VideoStarted'
}

export function isVideoCompleted(event: EngagementEvents): event is VideoCompletedEvent {
  return event.type === 'VideoCompleted'
}

export function isQuestionAnswered(event: EngagementEvents): event is QuestionAnsweredEvent {
  return event.type === 'QuestionAnswered'
}
