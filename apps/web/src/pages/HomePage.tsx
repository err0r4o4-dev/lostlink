import { Navigate } from 'react-router-dom'

import { useAuth } from '../features/auth/auth-state'
import { GuestHomePage } from './GuestHomePage'

export function HomePage() {
  const { user } = useAuth()

  return user ? <Navigate to="/discover" replace /> : <GuestHomePage />
}
