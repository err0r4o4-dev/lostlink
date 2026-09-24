import { apiRequest } from '../../api/client'
import type { PageOptions, Pagination } from '../../api/types'
import { pageQuery } from '../../api/types'
import type { AuthorizedRequest } from '../auth/auth-state'

export interface ReportRecord {
  id: string
  report_type: 'lost' | 'found'
  item_name: string
  category: string
  public_description: string
  event_date: string
  approximate_time: string | null
  approximate_location: string
  status: 'active' | 'withdrawn' | 'hidden' | 'closed'
  created_at: string
  withdrawn_at?: string | null
  closed_at?: string | null
}

export interface CreateReportInput {
  report_type: 'lost' | 'found'
  item_name: string
  category: string
  public_description: string
  event_date: string
  approximate_time: string
  approximate_location: string
}

export type UpdateReportInput = Partial<Omit<CreateReportInput, 'report_type'>>

export interface ReportImage {
  id: string
  content_type: 'image/jpeg' | 'image/png'
  size_bytes: number
  width: number
  height: number
  is_primary: boolean
  created_at: string
  content_url: string
}

export function createReport(request: AuthorizedRequest, input: CreateReportInput, idempotencyKey: string) {
  return request<{ report: ReportRecord }>('/v1/reports', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(input),
  })
}

export interface ReportPage {
  reports: ReportRecord[]
  pagination: Pagination
}

export function searchReports(filters: { q?: string; category?: string; type?: 'lost' | 'found' }) {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.category) params.set('category', filters.category)
  if (filters.type) params.set('type', filters.type)
  const query = params.toString()
  return apiRequest<ReportPage>(`/v1/reports${query ? `?${query}` : ''}`)
}

export function getReport(id: string) {
  return apiRequest<{ report: ReportRecord }>(`/v1/reports/${encodeURIComponent(id)}`)
}

export function listMyReports(request: AuthorizedRequest, options?: PageOptions) {
  return request<ReportPage>(`/v1/reports/mine${pageQuery(options)}`)
}

export function updateReport(request: AuthorizedRequest, id: string, input: UpdateReportInput) {
  return request<{ report: ReportRecord }>(`/v1/reports/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function withdrawReport(request: AuthorizedRequest, id: string) {
  return request<{ report: ReportRecord }>(`/v1/reports/${encodeURIComponent(id)}/withdraw`, { method: 'POST' })
}

export function listReportImages(reportId: string) {
  return apiRequest<{ images: ReportImage[] }>(`/v1/reports/${encodeURIComponent(reportId)}/images`)
}

export function uploadReportImage(request: AuthorizedRequest, reportId: string, image: File) {
  const form = new FormData()
  form.set('image', image)
  return request<{ image: ReportImage }>(`/v1/reports/${encodeURIComponent(reportId)}/images`, {
    method: 'POST',
    body: form,
  })
}

export function deleteReportImage(request: AuthorizedRequest, reportId: string, imageId: string) {
  return request<void>(`/v1/reports/${encodeURIComponent(reportId)}/images/${encodeURIComponent(imageId)}`, { method: 'DELETE' })
}

export function reportImageUrl(contentUrl: string) {
  return `/api${contentUrl}`
}
