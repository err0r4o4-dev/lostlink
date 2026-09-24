import type { AuthorizedRequest } from '../auth/auth-state'

export type ReturnStatus = 'scheduling' | 'scheduled' | 'picked_up' | 'returned' | 'closed' | 'cancelled'

export interface ReturnArrangement {
  id: string
  claim_id: string
  status: ReturnStatus
  pickup_at?: string
  pickup_location?: string
  private_notes?: string
  created_at: string
  updated_at: string
  completed_at?: string
  closed_at?: string
}

export interface TrackingEvent {
  id: string
  event_type: string
  message: string
  created_at: string
}

export interface Timeline {
  reference: string
  reference_type: 'report' | 'claim' | 'return'
  current_status: string
  events: TrackingEvent[]
}

export function getTrackingTimeline(request: AuthorizedRequest, reference: string) {
  return request<{ timeline: Timeline }>(`/v1/tracking/${encodeURIComponent(reference)}`)
}

export function getReturnArrangement(request: AuthorizedRequest, returnId: string) {
  return request<{ return_arrangement: ReturnArrangement }>(`/v1/return-arrangements/${encodeURIComponent(returnId)}`)
}
