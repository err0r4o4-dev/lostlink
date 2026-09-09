import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { LoadingState } from '../../components/ui'
import { useAuth } from './auth-state'

export function RequireAuth() {
  const auth = useAuth()
  const location = useLocation()
  if (auth.isLoading) return <LoadingState label="Restoring your session" />
  if (!auth.user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function RequireStaff() {
  const auth = useAuth()
  if (auth.isLoading) return <LoadingState label="Checking staff access" />
  if (!auth.user) return <Navigate to="/login" replace />
  if (auth.user.role !== 'staff' && auth.user.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}
