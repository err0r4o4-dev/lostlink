import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { apiBlobRequest, apiRequest } from '../../api/client'
import { createSession, endSession, refreshSession, type Credentials, type SessionResponse } from './auth-api'
import { AuthContext, type AuthContextValue } from './auth-state'
import { useLanguage } from '../../i18n/language'
import { showAlert } from '../../lib/alert'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionResponse | null>(null)
  const sessionRef = useRef<SessionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { translate } = useLanguage()

  const acceptSession = useCallback((next: SessionResponse) => {
    sessionRef.current = next
    setSession(next)
    setIsLoading(false)
  }, [])

  const clearSession = useCallback(() => {
    sessionRef.current = null
    setSession(null)
    setIsLoading(false)
  }, [])

  const refreshAccessToken = useCallback(async () => {
    try {
      const next = await refreshSession()
      acceptSession(next)
      return next.access_token
    } catch {
      clearSession()
      return null
    }
  }, [acceptSession, clearSession])

  useEffect(() => {
    let active = true
    void refreshSession()
      .then((next) => { if (active) acceptSession(next) })
      .catch(() => {
        if (active) {
          clearSession()
        }
      })
    return () => { active = false }
  }, [acceptSession, clearSession])

  useEffect(() => {
    if (!session) return
    const delay = Math.min(2_147_483_647, Math.max(1_000, new Date(session.expires_at).getTime() - Date.now() - 60_000))
    const timer = window.setTimeout(() => {
      void refreshSession().then(acceptSession).catch(() => {
        clearSession()
        void showAlert.info(translate('Session ended'), translate('Sign in again to continue using private LostLink features.'))
      })
    }, delay)
    return () => window.clearTimeout(timer)
  }, [acceptSession, clearSession, session, translate])

  const authenticate = useCallback(async (mode: 'login' | 'register', credentials: Credentials) => {
    acceptSession(await createSession(mode, credentials))
  }, [acceptSession])

  const logout = useCallback(async () => {
    try {
      await endSession()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const request = useCallback(<T,>(path: string, init?: RequestInit) => apiRequest<T>(path, init, {
    accessToken: sessionRef.current?.access_token,
    refreshAccessToken,
  }), [refreshAccessToken])

  const requestBlob = useCallback((path: string, init?: RequestInit) => apiBlobRequest(path, init, {
    accessToken: sessionRef.current?.access_token,
    refreshAccessToken,
  }), [refreshAccessToken])

  const value = useMemo<AuthContextValue>(() => ({
    accessToken: session?.access_token ?? null,
    user: session?.user ?? null,
    isLoading,
    request,
    requestBlob,
    authenticate,
    logout,
  }), [authenticate, isLoading, logout, request, requestBlob, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
