import type { PageOptions, Pagination } from '../../api/types'
import { pageQuery } from '../../api/types'
import type { AuthorizedBlobRequest, AuthorizedRequest } from '../auth/auth-state'

export type ClaimStatus = 'draft' | 'submitted' | 'under_review' | 'needs_more_info' | 'approved' | 'rejected' | 'cancelled'

export interface ClaimEvidence {
  id: string
  evidence_type: 'statement' | 'image'
  description: string
  content_type?: 'image/jpeg' | 'image/png'
  size_bytes?: number
  width?: number
  height?: number
  content_url?: string
  created_at: string
}

export interface VerificationDecision {
  id: string
  action: 'start_review' | 'request_more_info' | 'approve' | 'reject'
  reason?: string
  previous_status: ClaimStatus
  next_status: ClaimStatus
  created_at: string
}

export interface ClaimRecord {
  id: string
  match_id: string
  lost_report_id: string
  found_report_id: string
  claimant_id: string
  status: ClaimStatus
  submitted_at?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
  evidence?: ClaimEvidence[]
  decisions?: VerificationDecision[]
}

export interface ClaimPage {
  claims: ClaimRecord[]
  pagination: Pagination
}

export function createClaim(request: AuthorizedRequest, matchId: string, idempotencyKey: string) {
  return request<{ claim: ClaimRecord }>('/v1/claims', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ match_id: matchId }),
  })
}

export function listMyClaims(request: AuthorizedRequest, options?: PageOptions) {
  return request<ClaimPage>(`/v1/claims/mine${pageQuery(options)}`)
}

export function getClaim(request: AuthorizedRequest, claimId: string) {
  return request<{ claim: ClaimRecord }>(`/v1/claims/${encodeURIComponent(claimId)}`)
}

export function addClaimStatement(request: AuthorizedRequest, claimId: string, description: string) {
  return request<{ evidence: ClaimEvidence }>(`/v1/claims/${encodeURIComponent(claimId)}/evidence`, {
    method: 'POST',
    body: JSON.stringify({ description }),
  })
}

export function addClaimImage(request: AuthorizedRequest, claimId: string, description: string, image: File) {
  const form = new FormData()
  form.set('description', description)
  form.set('image', image)
  return request<{ evidence: ClaimEvidence }>(`/v1/claims/${encodeURIComponent(claimId)}/evidence`, {
    method: 'POST',
    body: form,
  })
}

export function deleteClaimEvidence(request: AuthorizedRequest, claimId: string, evidenceId: string) {
  return request<void>(`/v1/claims/${encodeURIComponent(claimId)}/evidence/${encodeURIComponent(evidenceId)}`, { method: 'DELETE' })
}

export function getClaimEvidenceContent(requestBlob: AuthorizedBlobRequest, claimId: string, evidenceId: string) {
  return requestBlob(`/v1/claims/${encodeURIComponent(claimId)}/evidence/${encodeURIComponent(evidenceId)}/content`)
}

export function respondToClaim(request: AuthorizedRequest, claimId: string, description: string) {
  return request<{ evidence: ClaimEvidence }>(`/v1/claims/${encodeURIComponent(claimId)}/responses`, {
    method: 'POST',
    body: JSON.stringify({ description }),
  })
}

export function submitClaim(request: AuthorizedRequest, claimId: string) {
  return request<{ claim: ClaimRecord }>(`/v1/claims/${encodeURIComponent(claimId)}/submit`, { method: 'POST' })
}

export function cancelClaim(request: AuthorizedRequest, claimId: string) {
  return request<{ claim: ClaimRecord }>(`/v1/claims/${encodeURIComponent(claimId)}/cancel`, { method: 'POST' })
}
