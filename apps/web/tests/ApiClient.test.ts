import { afterEach, describe, expect, it, vi } from 'vitest'

import { apiRequest } from '../src/api/client'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('apiRequest', () => {
  it('refreshes an expired access token and retries once', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'authentication_required', message: 'Authentication required' } }), { status: 401, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ value: 'ok' }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const refreshAccessToken = vi.fn().mockResolvedValue('new-access')

    await expect(apiRequest<{ value: string }>('/v1/private', undefined, { accessToken: 'old-access', refreshAccessToken })).resolves.toEqual({ value: 'ok' })

    expect(refreshAccessToken).toHaveBeenCalledOnce()
    const firstCall = fetchMock.mock.calls[0] as unknown as [RequestInfo | URL, RequestInit]
    const secondCall = fetchMock.mock.calls[1] as unknown as [RequestInfo | URL, RequestInit]
    const firstHeaders = new Headers(firstCall[1].headers)
    const secondHeaders = new Headers(secondCall[1].headers)
    expect(firstHeaders.get('Authorization')).toBe('Bearer old-access')
    expect(secondHeaders.get('Authorization')).toBe('Bearer new-access')
  })

  it('does not force a JSON content type for multipart uploads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ image: { id: 'image-1' } }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const form = new FormData()
    form.set('image', new File(['image'], 'item.png', { type: 'image/png' }))

    await apiRequest('/v1/reports/report-1/images', { method: 'POST', body: form }, { accessToken: 'access' })

    const call = fetchMock.mock.calls[0] as unknown as [RequestInfo | URL, RequestInit]
    const headers = new Headers(call[1].headers)
    expect(headers.has('Content-Type')).toBe(false)
    expect(headers.get('Authorization')).toBe('Bearer access')
  })
})
