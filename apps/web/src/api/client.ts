export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiAuthOptions {
  accessToken?: string | null
  refreshAccessToken?: () => Promise<string | null>
}

function requestHeaders(init?: RequestInit, accessToken?: string | null) {
  const headers = new Headers(init?.headers)
  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  return headers
}

async function apiFetch(path: string, init?: RequestInit, auth?: ApiAuthOptions) {
  const send = (accessToken?: string | null) => fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: requestHeaders(init, accessToken),
  })

  let response = await send(auth?.accessToken)
  if (response.status === 401 && auth?.refreshAccessToken) {
    const accessToken = await auth.refreshAccessToken().catch(() => null)
    if (accessToken) response = await send(accessToken)
  }

  return response
}

async function throwApiError(response: Response): Promise<never> {
  const payload = (await response.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null
  throw new ApiError(response.status, payload?.error?.code ?? 'request_failed', payload?.error?.message ?? 'The request could not be completed')
}

export async function apiRequest<T>(path: string, init?: RequestInit, auth?: ApiAuthOptions): Promise<T> {
  const response = await apiFetch(path, init, auth)

  if (!response.ok) {
    return throwApiError(response)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function apiBlobRequest(path: string, init?: RequestInit, auth?: ApiAuthOptions): Promise<Blob> {
  const response = await apiFetch(path, init, auth)
  if (!response.ok) return throwApiError(response)
  return response.blob()
}
