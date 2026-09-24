import type { PageOptions, Pagination } from '../../api/types'
import { pageQuery } from '../../api/types'
import type { ClaimRecord, ClaimStatus } from '../claims/claim-api'
import type { MatchPage, MatchRecord } from '../matching/matching-api'
import type { ReportPage, ReportRecord } from '../reports/report-api'
import type { ReturnArrangement, ReturnStatus } from '../tracking/tracking-api'
import type { AuthorizedRequest } from '../auth/auth-state'

export interface StaffDashboard {
  open_reports: number
  potential_matches: number
  claims_to_review: number
  returns_in_progress: number
}

export interface ReturnPage {
  return_arrangements: ReturnArrangement[]
  pagination: Pagination
}

export interface AuditEvent {
  id: string
  actor_id?: string
  action: string
  subject_type: 'report' | 'match' | 'claim' | 'return' | 'notification'
  subject_id: string
  metadata: Record<string, unknown>
  created_at: string
}

export function getStaffDashboard(request: AuthorizedRequest) {
  return request<{ dashboard: StaffDashboard }>('/v1/staff/dashboard')
}

export function listStaffReports(request: AuthorizedRequest, status?: ReportRecord['status'], options?: PageOptions) {
  const params = new URLSearchParams(pageQuery(options).slice(1))
  if (status) params.set('status', status)
  const query = params.toString()
  return request<ReportPage>(`/v1/staff/reports${query ? `?${query}` : ''}`)
}

export function moderateReport(request: AuthorizedRequest, reportId: string, action: 'hide' | 'restore' | 'close') {
  return request<{ report: ReportRecord }>(`/v1/staff/reports/${encodeURIComponent(reportId)}/moderation-actions`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  })
}

export function listStaffMatches(request: AuthorizedRequest, reviewStatus?: MatchRecord['review_status'], options?: PageOptions) {
  const params = new URLSearchParams(pageQuery(options).slice(1))
  if (reviewStatus) params.set('review_status', reviewStatus)
  const query = params.toString()
  return request<MatchPage>(`/v1/staff/matches${query ? `?${query}` : ''}`)
}

export function reviewMatch(request: AuthorizedRequest, matchId: string, action: 'review' | 'dismiss') {
  return request<{ match: MatchRecord }>(`/v1/staff/matches/${encodeURIComponent(matchId)}/review-actions`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  })
}

export function listStaffClaims(request: AuthorizedRequest, status?: ClaimStatus, options?: PageOptions) {
  const params = new URLSearchParams(pageQuery(options).slice(1))
  if (status) params.set('status', status)
  const query = params.toString()
  return request<{ claims: ClaimRecord[]; pagination: Pagination }>(`/v1/staff/claims${query ? `?${query}` : ''}`)
}

export function getStaffClaim(request: AuthorizedRequest, claimId: string) {
  return request<{ claim: ClaimRecord }>(`/v1/staff/claims/${encodeURIComponent(claimId)}`)
}

export function decideClaim(request: AuthorizedRequest, claimId: string, action: 'start_review' | 'request_more_info' | 'approve' | 'reject', reason?: string) {
  return request<{ claim: ClaimRecord }>(`/v1/staff/claims/${encodeURIComponent(claimId)}/decisions`, {
    method: 'POST',
    body: JSON.stringify({ action, ...(reason ? { reason } : {}) }),
  })
}

export function listStaffReturns(request: AuthorizedRequest, status?: ReturnStatus, options?: PageOptions) {
  const params = new URLSearchParams(pageQuery(options).slice(1))
  if (status) params.set('status', status)
  const query = params.toString()
  return request<ReturnPage>(`/v1/staff/returns${query ? `?${query}` : ''}`)
}

export function createReturnArrangement(request: AuthorizedRequest, claimId: string) {
  return request<{ return_arrangement: ReturnArrangement }>(`/v1/staff/claims/${encodeURIComponent(claimId)}/return-arrangements`, { method: 'POST' })
}

export function scheduleReturn(request: AuthorizedRequest, returnId: string, input: { pickup_at: string; pickup_location: string; private_notes?: string }) {
  return request<{ return_arrangement: ReturnArrangement }>(`/v1/staff/return-arrangements/${encodeURIComponent(returnId)}/schedule`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function transitionReturn(request: AuthorizedRequest, returnId: string, action: 'confirm-pickup' | 'complete' | 'close' | 'cancel') {
  return request<{ return_arrangement: ReturnArrangement }>(`/v1/staff/return-arrangements/${encodeURIComponent(returnId)}/${action}`, { method: 'POST' })
}

export function listAuditEvents(request: AuthorizedRequest, options?: PageOptions) {
  return request<{ audit_events: AuditEvent[]; pagination: Pagination }>(`/v1/admin/audit-events${pageQuery(options)}`)
}
