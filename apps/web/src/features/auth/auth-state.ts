import { createContext, useContext } from 'react'

import type { AuthUser, Credentials } from './auth-api'

export interface AuthContextValue {
  accessToken: string | null
  user: AuthUser | null
  isLoading: boolean
  authenticate: (mode: 'login' | 'register', credentials: Credentials) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
