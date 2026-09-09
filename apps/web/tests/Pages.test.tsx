import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, matchRoutes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { LoginPage } from '../src/pages/AuthPages'
import { ReportLostPage } from '../src/pages/ReportPages'
import { router } from '../src/routes/router'
import { FileUpload } from '../src/components/file-upload'

const approvedRoutes = [
  '/', '/discover', '/search', '/report', '/report/lost', '/report/found', '/items/item-reference',
  '/matches', '/matches/match-reference', '/verification', '/claims/new', '/claims/claim-reference',
  '/tracking', '/notifications', '/profile', '/help', '/locations', '/onboarding', '/staff',
  '/staff/reports', '/staff/matches', '/staff/claims', '/login', '/register', '/forgot-password', '/reset-password',
]

describe('frontend completion routes', () => {
  it.each(approvedRoutes)('defines %s', (path) => {
    expect(matchRoutes(router.routes, path)).not.toBeNull()
  })

  it('validates and reviews a lost-report draft without faking submission', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><ReportLostPage /></MemoryRouter>)

    await user.click(screen.getByRole('button', { name: 'Review report' }))
    expect(await screen.findByText('Enter a clear item name.')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /kept contact information/i })).toHaveAttribute('aria-invalid', 'true')

    await user.type(screen.getByLabelText(/item name/i), 'Black water bottle')
    await user.type(screen.getByLabelText(/^category/i), 'Drinkware')
    await user.type(screen.getByRole('textbox', { name: /^public description/i }), 'Matte black bottle with a silver lid.')
    fireEvent.change(screen.getByLabelText(/date lost/i), { target: { value: '2026-09-09' } })
    await user.type(screen.getByLabelText(/approximate location/i), 'Campus library')
    await user.click(screen.getByRole('checkbox', { name: /kept contact information/i }))
    await user.click(screen.getByRole('button', { name: 'Review report' }))

    expect(await screen.findByRole('heading', { name: 'Review your report' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submission unavailable' })).toBeDisabled()
    expect(screen.getByText('Integration pending')).toBeInTheDocument()
  })

  it('validates login and exposes the missing authentication boundary', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><LoginPage /></MemoryRouter>)

    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/enter your university email/i)).toBeInTheDocument()
    await user.type(screen.getByLabelText(/university email/i), 'student@example.edu')
    await user.type(screen.getByLabelText(/^password/i), 'local-test-only')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Integration pending')).toBeInTheDocument()
  })

  it('rejects unsupported local image previews accessibly', () => {
    render(<FileUpload />)
    const input = screen.getByLabelText(/choose an item photo/i)
    fireEvent.change(input, { target: { files: [new File(['not-an-image'], 'evidence.txt', { type: 'text/plain' })] } })

    expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPG, PNG, or WebP image.')
  })
})
