import { createBrowserRouter } from 'react-router-dom'

import { AppShell } from '../layouts/AppShell'
import { HomePage } from '../pages/HomePage'
import { RequireAuth, RequireStaff } from '../features/auth/route-guards'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'discover', lazy: async () => ({ Component: (await import('../pages/DiscoveryPages')).DiscoveryHubPage }) },
      { path: 'search', lazy: async () => ({ Component: (await import('../pages/DiscoveryPages')).SearchPage }) },
      { path: 'items/:itemId', lazy: async () => ({ Component: (await import('../pages/DiscoveryPages')).ItemDetailPage }) },
      { path: 'help', lazy: async () => ({ Component: (await import('../pages/SupportPages')).HelpPage }) },
      { path: 'locations', lazy: async () => ({ Component: (await import('../pages/SupportPages')).LocationsPage }) },
      { path: 'onboarding', lazy: async () => ({ Component: (await import('../pages/AuthPages')).OnboardingPage }) },
      {
        element: <RequireAuth />,
        children: [
          { path: 'report', lazy: async () => ({ Component: (await import('../pages/ReportPages')).ReportHubPage }) },
          { path: 'report/lost', lazy: async () => ({ Component: (await import('../pages/ReportPages')).ReportLostPage }) },
          { path: 'report/found', lazy: async () => ({ Component: (await import('../pages/ReportPages')).ReportFoundPage }) },
          { path: 'matches', lazy: async () => ({ Component: (await import('../pages/DiscoveryPages')).MatchesPage }) },
          { path: 'matches/:matchId', lazy: async () => ({ Component: (await import('../pages/DiscoveryPages')).MatchDetailPage }) },
          { path: 'verification', lazy: async () => ({ Component: (await import('../pages/ClaimPages')).VerificationGuidePage }) },
          { path: 'claims/new', lazy: async () => ({ Component: (await import('../pages/ClaimPages')).NewClaimPage }) },
          { path: 'claims/:claimId', lazy: async () => ({ Component: (await import('../pages/ClaimPages')).ClaimDetailPage }) },
          { path: 'tracking', lazy: async () => ({ Component: (await import('../pages/SupportPages')).TrackingPage }) },
          { path: 'notifications', lazy: async () => ({ Component: (await import('../pages/SupportPages')).NotificationsPage }) },
          { path: 'profile', lazy: async () => ({ Component: (await import('../pages/SupportPages')).ProfilePage }) },
        ],
      },
      {
        element: <RequireStaff />,
        children: [
          { path: 'staff', lazy: async () => ({ Component: (await import('../pages/StaffPages')).StaffDashboardPage }) },
          { path: 'staff/reports', lazy: async () => ({ Component: (await import('../pages/StaffPages')).StaffReportsPage }) },
          { path: 'staff/matches', lazy: async () => ({ Component: (await import('../pages/StaffPages')).StaffMatchesPage }) },
          { path: 'staff/claims', lazy: async () => ({ Component: (await import('../pages/StaffPages')).StaffClaimsPage }) },
        ],
      },
      { path: '*', lazy: async () => ({ Component: (await import('../pages/NotFoundPage')).NotFoundPage }) },
    ],
  },
  { path: '/login', lazy: async () => ({ Component: (await import('../pages/AuthPages')).LoginPage }) },
  { path: '/register', lazy: async () => ({ Component: (await import('../pages/AuthPages')).RegisterPage }) },
  { path: '/forgot-password', lazy: async () => ({ Component: (await import('../pages/AuthPages')).ForgotPasswordPage }) },
  { path: '/reset-password', lazy: async () => ({ Component: (await import('../pages/AuthPages')).ResetPasswordPage }) },
  { path: '/auth/callback', lazy: async () => ({ Component: (await import('../pages/AuthPages')).GoogleAuthCallbackPage }) },
])
