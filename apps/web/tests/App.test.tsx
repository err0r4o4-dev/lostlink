import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { App } from '../src/App'

describe('App', () => {
  it('renders the guest home with the matching and privacy trust boundaries', () => {
    render(<App />)

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByRole('heading', { level: 1, name: /lost items.*may be waiting for you/i })).toBeInTheDocument()
    expect(screen.getByText(/AI only assists with discovery and similarity ranking/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /without revealing more than necessary/ })).toBeInTheDocument()
    expect(screen.getByText('Verification happens before return')).toBeInTheDocument()
  })

  it('sends guest calls to action only to authentication routes', () => {
    render(<App />)

    const hero = screen.getByRole('heading', { level: 1 }).closest('section')
    if (!hero) throw new Error('Expected the guest hero section')

    expect(within(hero).getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/register')
    expect(within(hero).queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Authentication' }).getElementsByTagName('a')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
    expect(screen.queryByRole('link', { name: /Create account/ })).not.toBeInTheDocument()
  })

  it('does not mount authenticated navigation for a guest session', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main-content')
    expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Mobile primary' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Search' })).not.toBeInTheDocument()
  })

  it('exposes only the requested public footer destinations', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
    expect(screen.getByRole('link', { name: 'Terms of use' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute('href', '/help')
  })

  it('switches the guest home between English and Thai', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'เปลี่ยนภาษาเป็นไทย' }))

    expect(screen.getByRole('heading', { level: 1, name: /ของที่หาย.*อาจกำลังรอให้คุณมาพบ/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'เข้าสู่ระบบ' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('button', { name: 'Switch language to English' })).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'th')
  })
})
