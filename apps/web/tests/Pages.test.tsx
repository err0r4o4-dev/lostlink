import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, matchRoutes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const alertMocks = vi.hoisted(() => ({
  success: vi.fn(() => Promise.resolve()),
  error: vi.fn(() => Promise.resolve()),
  info: vi.fn(() => Promise.resolve()),
  confirm: vi.fn(() => Promise.resolve(true)),
  confirmDestructive: vi.fn(() => Promise.resolve(true)),
}))

vi.mock('../src/lib/alert', () => ({ showAlert: alertMocks }))

import { ApiError } from '../src/api/client'
import { GoogleAuthCallbackPage, LoginPage, RegisterPage } from '../src/pages/AuthPages'
import { ReportLostPage } from '../src/pages/ReportPages'
import { ProfilePage } from '../src/pages/SupportPages'
import { router } from '../src/routes/router'
import { FileUpload } from '../src/components/file-upload'
import { LanguageProvider } from '../src/i18n/language'
import { AuthProvider } from '../src/features/auth/auth-context'
import { AuthContext } from '../src/features/auth/auth-state'

const approvedRoutes = [
  '/', '/discover', '/search', '/report', '/report/lost', '/report/found', '/items/item-reference',
  '/matches', '/matches/match-reference', '/verification', '/claims/new', '/claims/claim-reference',
  '/tracking', '/notifications', '/profile', '/help', '/locations', '/onboarding', '/staff',
  '/staff/reports', '/staff/matches', '/staff/claims', '/login', '/register', '/forgot-password', '/reset-password',
  '/auth/callback', '/privacy', '/terms',
]

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

const authenticatedContext = {
  accessToken: 'test-access',
  user: { id: 'user-1', identifier: 'student@example.edu', role: 'user' as const, created_at: '2026-09-09T00:00:00Z' },
  isLoading: false,
  authenticate: () => Promise.resolve(),
  logout: () => Promise.resolve(),
}

async function reviewValidLostReport(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/item name/i), 'Black water bottle')
  await user.type(screen.getByLabelText(/^category/i), 'Drinkware')
  await user.type(screen.getByRole('textbox', { name: /^public description/i }), 'Matte black bottle with a silver lid.')
  fireEvent.change(screen.getByLabelText(/date lost/i), { target: { value: '2026-09-09' } })
  await user.type(screen.getByLabelText(/approximate location/i), 'Campus library')
  await user.type(screen.getByLabelText(/private identifying/i), 'Private scratch beneath the base')
  await user.click(screen.getByRole('checkbox', { name: /kept contact information/i }))
  await user.click(screen.getByRole('button', { name: 'Review report' }))
}

describe('frontend completion routes', () => {
  it.each(approvedRoutes)('defines %s', (path) => {
    expect(matchRoutes(router.routes, path)).not.toBeNull()
  })

  it('submits approved report fields without sending private verification details', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ report: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', report_type: 'lost', item_name: 'Black water bottle', category: 'Drinkware', public_description: 'Matte black bottle with a silver lid.', event_date: '2026-09-09', approximate_time: null, approximate_location: 'Campus library', created_at: '2026-09-09T00:00:00Z' } }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    render(<AuthContext.Provider value={authenticatedContext}><MemoryRouter><ReportLostPage /></MemoryRouter></AuthContext.Provider>)

    await user.click(screen.getByRole('button', { name: 'Review report' }))
    expect(await screen.findByText('Enter a clear item name.')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /kept contact information/i })).toHaveAttribute('aria-invalid', 'true')

    await reviewValidLostReport(user)

    expect(await screen.findByRole('heading', { name: 'Review your report' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit report' })).toBeEnabled()
    expect(screen.getByText('Private fields stay local')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Submit report' }))
    expect(await screen.findByText('Report submitted')).toBeInTheDocument()
    expect(alertMocks.success).toHaveBeenCalledWith('Report submitted', 'Your report has been saved.')
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    if (typeof request.body !== 'string') throw new Error('Expected a JSON request body')
    expect(request.body).not.toContain('Private scratch')
    expect(request.body).not.toContain('identifying')
  })

  it('keeps report submission failures visible and announces them with SweetAlert', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'request_failed', message: 'Report could not be saved' } }), { status: 503, headers: { 'Content-Type': 'application/json' } })))
    render(<AuthContext.Provider value={authenticatedContext}><MemoryRouter><ReportLostPage /></MemoryRouter></AuthContext.Provider>)

    await reviewValidLostReport(user)
    await user.click(screen.getByRole('button', { name: 'Submit report' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Report could not be saved')
    expect(alertMocks.error).toHaveBeenCalledWith('Submission failed', 'Report could not be saved')
  })

  it('localizes page copy, form labels, and validation feedback in Thai', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('lostlink-language', 'th')
    render(<LanguageProvider><AuthContext.Provider value={authenticatedContext}><MemoryRouter><ReportLostPage /></MemoryRouter></AuthContext.Provider></LanguageProvider>)

    expect(screen.getByRole('heading', { level: 1, name: 'แจ้งของหาย' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^ชื่อสิ่งของ/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'ตรวจสอบประกาศ' }))
    expect(await screen.findByText('กรอกชื่อสิ่งของให้ชัดเจน')).toBeInTheDocument()
  })

  it('validates login and submits to the authentication boundary', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'invalid_session', message: 'Authentication required' } }), { status: 401, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: 'access', token_type: 'Bearer', expires_at: '2099-01-01T00:00:00Z', user: { id: 'user-1', identifier: 'student@example.edu', role: 'user', created_at: '2026-09-09T00:00:00Z' } }), { status: 200, headers: { 'Content-Type': 'application/json' } })))
    render(<AuthProvider><MemoryRouter><LoginPage /></MemoryRouter></AuthProvider>)
    expect(screen.getByRole('link', { name: 'Continue with Google' })).toHaveAttribute('href', '/api/v1/auth/google/start')

    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/use at least 3 characters/i)).toBeInTheDocument()
    await user.type(screen.getByLabelText(/university email/i), 'student@example.edu')
    await user.type(screen.getByLabelText(/^password/i), 'local-test-only')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(fetch).toHaveBeenLastCalledWith('/api/v1/auth/login', expect.objectContaining({ method: 'POST', credentials: 'include' })))
    expect(alertMocks.success).toHaveBeenCalledWith('Signed in successfully', 'Welcome back to LostLink.')
  })

  it('keeps authentication errors visible and announces them with SweetAlert', async () => {
    const user = userEvent.setup()
    const authenticate = vi.fn().mockRejectedValue(new ApiError(401, 'invalid_credentials', 'Invalid identifier or password'))
    render(<AuthContext.Provider value={{ ...authenticatedContext, authenticate }}><MemoryRouter><LoginPage /></MemoryRouter></AuthContext.Provider>)

    await user.type(screen.getByLabelText(/university email/i), 'student@example.edu')
    await user.type(screen.getByLabelText(/^password/i), 'local-test-only')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid identifier or password')
    expect(alertMocks.error).toHaveBeenCalledWith('Sign in failed', 'Invalid identifier or password')
  })

  it('announces successful account registration before continuing', async () => {
    const user = userEvent.setup()
    const authenticate = vi.fn().mockResolvedValue(undefined)
    render(<AuthContext.Provider value={{ ...authenticatedContext, authenticate }}><MemoryRouter><RegisterPage /></MemoryRouter></AuthContext.Provider>)

    await user.type(screen.getByLabelText(/university email/i), 'student@example.edu')
    await user.type(screen.getByLabelText(/^password/i), 'local-test-only')
    await user.type(screen.getByLabelText(/confirm password/i), 'local-test-only')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(authenticate).toHaveBeenCalledWith('register', {
      identifier: 'student@example.edu',
      password: 'local-test-only',
    }))
    expect(alertMocks.success).toHaveBeenCalledWith('Account created', 'Your LostLink account is ready.')
  })

  it('requires confirmation before signing out and reports completion', async () => {
    const user = userEvent.setup()
    const logout = vi.fn().mockResolvedValue(undefined)
    render(<AuthContext.Provider value={{ ...authenticatedContext, logout }}><MemoryRouter><ProfilePage /></MemoryRouter></AuthContext.Provider>)

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => {
      expect(alertMocks.confirm).toHaveBeenCalledWith(
        'Sign out?',
        'You will need to sign in again to access private LostLink features.',
        'Sign out',
        'Stay signed in',
      )
      expect(logout).toHaveBeenCalledOnce()
      expect(alertMocks.success).toHaveBeenCalledWith('Signed out', 'Your LostLink session has ended.')
    })
  })

  it('keeps the session when sign-out confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const logout = vi.fn().mockResolvedValue(undefined)
    alertMocks.confirm.mockResolvedValueOnce(false)
    render(<AuthContext.Provider value={{ ...authenticatedContext, logout }}><MemoryRouter><ProfilePage /></MemoryRouter></AuthContext.Provider>)

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(logout).not.toHaveBeenCalled()
    expect(alertMocks.success).not.toHaveBeenCalled()
  })

  it('warns when server-side logout cannot be confirmed', async () => {
    const user = userEvent.setup()
    const logout = vi.fn().mockRejectedValue(new Error('network unavailable'))
    render(<AuthContext.Provider value={{ ...authenticatedContext, logout }}><MemoryRouter><ProfilePage /></MemoryRouter></AuthContext.Provider>)

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => expect(alertMocks.error).toHaveBeenCalledWith(
      'Sign-out incomplete',
      'The local session was cleared, but the server could not confirm logout. Close the browser if this is a shared device.',
    ))
  })

  it('shows a generic Google callback failure without exposing provider details', () => {
    render(<AuthContext.Provider value={authenticatedContext}><MemoryRouter initialEntries={['/auth/callback?error=google_sign_in_failed']}><GoogleAuthCallbackPage /></MemoryRouter></AuthContext.Provider>)

    expect(screen.getByRole('heading', { name: 'Google sign-in failed' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Try again from the sign-in page')
    expect(screen.queryByText(/authorization code|state value|client secret/i)).not.toBeInTheDocument()
  })

  it('rejects unsupported local image previews accessibly', () => {
    render(<FileUpload />)
    const input = screen.getByLabelText(/choose an item photo/i)
    fireEvent.change(input, { target: { files: [new File(['not-an-image'], 'evidence.txt', { type: 'text/plain' })] } })

    expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPG, PNG, or WebP image.')
  })
})
