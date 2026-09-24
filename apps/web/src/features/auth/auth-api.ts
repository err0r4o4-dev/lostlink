import { apiRequest } from '../../api/client'

export type Role = 'user' | 'staff' | 'admin'

export interface AuthUser {
  id: string
  identifier: string
  role: Role
  created_at: string
}

export interface SessionResponse {
  access_token: string
  token_type: 'Bearer'
  expires_at: string
  user: AuthUser
}

export interface Credentials {
  identifier: string
  password: string
}

export function createSession(mode: 'login' | 'register', credentials: Credentials) {
  return apiRequest<SessionResponse>(`/v1/auth/${mode}`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

let pendingRefresh: Promise<SessionResponse> | undefined

export function refreshSession() {
  if (!pendingRefresh) {
    pendingRefresh = apiRequest<SessionResponse>('/v1/auth/refresh', { method: 'POST' }).finally(() => {
      pendingRefresh = undefined
    })
  }
  return pendingRefresh
}

export function endSession() {
  return apiRequest<void>('/v1/auth/logout', { method: 'POST' })
}

export function getCurrentUser(request: <T>(path: string, init?: RequestInit) => Promise<T>) {
  return request<{ user: AuthUser }>('/v1/auth/me')
}
