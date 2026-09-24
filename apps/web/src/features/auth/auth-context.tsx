import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import { createSession, endSession, refreshSession, type Credentials, type SessionResponse } from './auth-api'
import { AuthContext, type AuthContextValue } from './auth-state'
import { useLanguage } from '../../i18n/language'
import { showAlert } from '../../lib/alert'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { translate } = useLanguage()

  const acceptSession = useCallback((next: SessionResponse) => {
    setSession(next)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let active = true
    void refreshSession()
      .then((next) => { if (active) acceptSession(next) })
      .catch(() => {
        if (active) {
          setSession(null)
          setIsLoading(false)
        }
      })
    return () => { active = false }
  }, [acceptSession])

  useEffect(() => {
    if (!session) return
    const delay = Math.min(2_147_483_647, Math.max(1_000, new Date(session.expires_at).getTime() - Date.now() - 60_000))
    const timer = window.setTimeout(() => {
      void refreshSession().then(acceptSession).catch(() => {
        setSession(null)
        void showAlert.info(translate('Session ended'), translate('Sign in again to continue using private LostLink features.'))
      })
    }, delay)
    return () => window.clearTimeout(timer)
  }, [acceptSession, session, translate])

  const authenticate = useCallback(async (mode: 'login' | 'register', credentials: Credentials) => {
    acceptSession(await createSession(mode, credentials))
  }, [acceptSession])

  const logout = useCallback(async () => {
    try {
      await endSession()
    } finally {
      setSession(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    accessToken: session?.access_token ?? null,
    user: session?.user ?? null,
    isLoading,
    authenticate,
    logout,
  }), [authenticate, isLoading, logout, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
