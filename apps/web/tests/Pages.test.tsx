import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes, matchRoutes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

const alertMocks = vi.hoisted(() => ({
  success: vi.fn(() => Promise.resolve()),
  error: vi.fn(() => Promise.resolve()),
  info: vi.fn(() => Promise.resolve()),
  confirm: vi.fn(() => Promise.resolve(true)),
  confirmDestructive: vi.fn(() => Promise.resolve(true)),
}))

vi.mock('../src/lib/alert', () => ({ showAlert: alertMocks }))

import { ApiError, apiBlobRequest, apiRequest } from '../src/api/client'
import { GoogleAuthCallbackPage, LoginPage, RegisterPage } from '../src/pages/AuthPages'
import { HomePage } from '../src/pages/HomePage'
import { SearchPage } from '../src/pages/DiscoveryPages'
import { NewClaimPage } from '../src/pages/ClaimPages'
import { ReportLostPage } from '../src/pages/ReportPages'
import { StaffClaimDetailPage } from '../src/pages/StaffPages'
import { ProfilePage } from '../src/pages/SupportPages'
import { router } from '../src/routes/router'
import { FileUpload } from '../src/components/file-upload'
import { LanguageProvider } from '../src/i18n/language'
import { AuthProvider } from '../src/features/auth/auth-context'
import { AuthContext } from '../src/features/auth/auth-state'
import { RequireAuth } from '../src/features/auth/route-guards'

const approvedRoutes = [
  '/', '/discover', '/search', '/report', '/report/lost', '/report/found', '/items/item-reference',
  '/reports/report-reference/manage', '/matches', '/matches/match-reference', '/verification', '/claims', '/claims/new', '/claims/claim-reference',
  '/tracking', '/notifications', '/profile', '/help', '/locations', '/onboarding', '/staff',
  '/staff/reports', '/staff/matches', '/staff/claims', '/staff/claims/claim-reference', '/staff/returns', '/staff/returns/return-reference', '/admin/audit-events', '/login', '/register', '/forgot-password', '/reset-password',
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
  request: <T,>(path: string, init?: RequestInit) => apiRequest<T>(path, init, { accessToken: 'test-access' }),
  requestBlob: (path: string, init?: RequestInit) => apiBlobRequest(path, init, { accessToken: 'test-access' }),
  authenticate: () => Promise.resolve(),
  logout: () => Promise.resolve(),
}

function renderWithQuery(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}>{children}</QueryClientProvider>)
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

  it('redirects authenticated users away from the removed home page', () => {
    render(
      <AuthContext.Provider value={authenticatedContext}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/discover" element={<h1>Discovery tools</h1>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Discovery tools' })).toBeInTheDocument()
    expect(screen.queryByText('Lost items deserve a clear path home.')).not.toBeInTheDocument()
  })

  it('preserves a protected destination query when redirecting to sign in', () => {
    function LoginDestination() {
      const location = useLocation()
      return <p>{(location.state as { from?: string } | null)?.from}</p>
    }

    render(
      <AuthContext.Provider value={{ ...authenticatedContext, accessToken: null, user: null }}>
        <MemoryRouter initialEntries={['/claims/new?match=match-reference']}>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route path="/claims/new" element={<p>Protected claim form</p>} />
            </Route>
            <Route path="/login" element={<LoginDestination />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(screen.getByText('/claims/new?match=match-reference')).toBeInTheDocument()
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
    expect(screen.getByText('Check what will be shared')).toBeInTheDocument()
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

  it('keeps a created claim draft reachable when saving initial evidence fails', async () => {
    const user = userEvent.setup()
    const claimId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ claim: { id: claimId } }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'service_unavailable', message: 'Evidence unavailable' } }), { status: 503, headers: { 'Content-Type': 'application/json' } })))

    renderWithQuery(
      <AuthContext.Provider value={authenticatedContext}>
        <MemoryRouter initialEntries={['/claims/new?match=match-reference']}>
          <Routes>
            <Route path="/claims/new" element={<NewClaimPage />} />
            <Route path="/claims/:claimId" element={<h1>Claim draft destination</h1>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    await user.type(screen.getByRole('textbox', { name: 'Private ownership details' }), 'A private identifying mark under the item.')
    await user.click(screen.getByRole('button', { name: 'Review claim' }))
    await user.click(screen.getByRole('button', { name: 'Create claim draft' }))

    expect(await screen.findByRole('heading', { name: 'Claim draft destination' })).toBeInTheDocument()
    expect(alertMocks.info).toHaveBeenCalledWith('Claim draft created', 'Some evidence could not be saved. Open the draft and add the missing evidence before submitting it.')
  })

  it('matches staff claim decisions to backend state and reason rules', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ claim: {
      id: 'claim-1',
      match_id: 'match-1',
      lost_report_id: 'lost-1',
      found_report_id: 'found-1',
      claimant_id: 'user-1',
      status: 'submitted',
      created_at: '2026-09-09T00:00:00Z',
      updated_at: '2026-09-09T00:00:00Z',
      evidence: [],
    } }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    renderWithQuery(
      <AuthContext.Provider value={authenticatedContext}>
        <MemoryRouter initialEntries={['/staff/claims/claim-1']}>
          <Routes><Route path="/staff/claims/:claimId" element={<StaffClaimDetailPage />} /></Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(await screen.findByRole('button', { name: 'Approve claim' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Request more information' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reject claim' })).toBeDisabled()
  })

  it('does not offer staff transitions that the backend rejects from needs-more-info', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ claim: {
      id: 'claim-1',
      match_id: 'match-1',
      lost_report_id: 'lost-1',
      found_report_id: 'found-1',
      claimant_id: 'user-1',
      status: 'needs_more_info',
      created_at: '2026-09-09T00:00:00Z',
      updated_at: '2026-09-09T00:00:00Z',
      evidence: [],
    } }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    renderWithQuery(
      <AuthContext.Provider value={authenticatedContext}>
        <MemoryRouter initialEntries={['/staff/claims/claim-1']}>
          <Routes><Route path="/staff/claims/:claimId" element={<StaffClaimDetailPage />} /></Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    )

    expect(await screen.findByText('The current API does not accept another staff decision from this state.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve claim' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request more information' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject claim' })).not.toBeInTheDocument()
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
    await user.type(screen.getByLabelText(/^password/i), 'replace-me-test-only')
    await user.type(screen.getByLabelText(/confirm password/i), 'replace-me-test-only')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(authenticate).toHaveBeenCalledWith('register', {
      identifier: 'student@example.edu',
      password: 'replace-me-test-only',
    }))
    expect(alertMocks.success).toHaveBeenCalledWith('Account created', 'Your LostLink account is ready.')
  })

  it('requires confirmation before signing out and reports completion', async () => {
    const user = userEvent.setup()
    const logout = vi.fn().mockResolvedValue(undefined)
    renderWithQuery(<AuthContext.Provider value={{ ...authenticatedContext, logout }}><MemoryRouter><ProfilePage /></MemoryRouter></AuthContext.Provider>)

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
    renderWithQuery(<AuthContext.Provider value={{ ...authenticatedContext, logout }}><MemoryRouter><ProfilePage /></MemoryRouter></AuthContext.Provider>)

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(logout).not.toHaveBeenCalled()
    expect(alertMocks.success).not.toHaveBeenCalled()
  })

  it('warns when server-side logout cannot be confirmed', async () => {
    const user = userEvent.setup()
    const logout = vi.fn().mockRejectedValue(new Error('network unavailable'))
    renderWithQuery(<AuthContext.Provider value={{ ...authenticatedContext, logout }}><MemoryRouter><ProfilePage /></MemoryRouter></AuthContext.Provider>)

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

    expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPG or PNG image.')
  })

  it('renders search placeholder initially and hides it when results exist in cache', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    // 1. Initial state (no search done, empty cache) -> shows placeholder
    const { unmount } = render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/search']}>
          <SearchPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText('Start with an item description')).toBeInTheDocument()
    expect(screen.getByText('Search not started')).toBeInTheDocument()
    unmount()

    // 2. Returning to /search with cached results -> does not show placeholder banner, shows result cards
    client.setQueryData(['reports', { q: undefined, category: undefined, type: undefined }], {
      reports: [
        {
          id: 'report-1',
          report_type: 'lost',
          item_name: 'Blue Backpack',
          category: 'Bags',
          approximate_location: 'Central Library',
          event_date: '2026-09-20',
        },
      ],
    })

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/search']}>
          <SearchPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.queryByText('Start with an item description')).not.toBeInTheDocument()
    expect(screen.getByText('Blue Backpack')).toBeInTheDocument()
    expect(screen.getByText('1 results')).toBeInTheDocument()
  })
})
