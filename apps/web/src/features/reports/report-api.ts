import { apiRequest } from '../../api/client'

export interface ReportRecord {
  id: string
  report_type: 'lost' | 'found'
  item_name: string
  category: string
  public_description: string
  event_date: string
  approximate_time: string | null
  approximate_location: string
  created_at: string
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

export function createReport(input: CreateReportInput, accessToken: string, idempotencyKey: string) {
  return apiRequest<{ report: ReportRecord }>('/v1/reports', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(input),
  })
}

export interface ReportPage {
  reports: ReportRecord[]
  pagination: { limit: number; offset: number }
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
