import type { Pagination } from '../../api/types'
import type { AuthorizedRequest } from '../auth/auth-state'

export interface MatchCandidate {
  id: string
  report_type: 'lost' | 'found'
  item_name: string
  category: string
  public_description: string
  event_date: string
  approximate_location: string
  created_at: string
}

export interface MatchRecord {
  id: string
  source_report_id: string
  score: number
  signals: string[]
  model_version: string
  config_version: string
  review_status: 'pending' | 'reviewed' | 'dismissed'
  created_at: string
  candidate: MatchCandidate
}

export interface MatchingRun {
  id: string
  report_id: string
  status: 'processing' | 'completed' | 'failed'
  model_version?: string
  config_version?: string
  candidate_count: number
  failure_code?: string
  created_at: string
  completed_at?: string
}

export function runMatching(request: AuthorizedRequest, reportId: string, idempotencyKey: string) {
  return request<{ run: MatchingRun; matches: MatchRecord[] }>(`/v1/reports/${encodeURIComponent(reportId)}/matching-runs`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
  })
}

export function listReportMatches(request: AuthorizedRequest, reportId: string) {
  return request<{ matches: MatchRecord[] }>(`/v1/reports/${encodeURIComponent(reportId)}/matches`)
}

export function getMatch(request: AuthorizedRequest, matchId: string) {
  return request<{ match: MatchRecord }>(`/v1/matches/${encodeURIComponent(matchId)}`)
}

export interface MatchPage {
  matches: MatchRecord[]
  pagination: Pagination
}
