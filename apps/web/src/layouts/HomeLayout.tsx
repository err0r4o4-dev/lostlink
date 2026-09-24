import { AppShell } from './AppShell'
import { PublicLayout } from './PublicLayout'
import { useAuth } from '../features/auth/auth-state'

export function HomeLayout() {
  const { user } = useAuth()

  return user ? <AppShell /> : <PublicLayout />
}
