import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { App } from '../src/App'

describe('App', () => {
  it('renders one accessible page and preserves the matching trust boundary', () => {
    render(<App />)

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByRole('heading', { level: 1, name: /lost items deserve/i })).toBeInTheDocument()
    expect(screen.getByText(/similarity assists discovery/i)).toBeInTheDocument()
    expect(screen.getByText(/verification stays private/i)).toBeInTheDocument()
    expect(screen.getByText(/humans make the decision/i)).toBeInTheDocument()
  })

  it('links to complete frontend workflows without inventing server results', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: /report a lost item/i })).toHaveAttribute('href', '/report/lost')
    expect(screen.getByRole('link', { name: /report a found item/i })).toHaveAttribute('href', '/report/found')
    expect(screen.getByRole('link', { name: /open search/i })).toHaveAttribute('href', '/search')
    expect(screen.getByText(/no public items yet/i)).toBeInTheDocument()
  })

  it('exposes skip and section navigation landmarks', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main-content')
    expect(screen.getAllByRole('navigation').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByRole('link', { name: 'Search' }).length).toBeGreaterThanOrEqual(2)
  })

  it('switches the interface between English and Thai and remembers the choice', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: 'เปลี่ยนภาษาเป็นไทย' })[0])

    expect(screen.getByRole('heading', { level: 1, name: 'ของที่หายควรมีเส้นทางกลับคืนอย่างชัดเจน' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'ค้นหา' }).length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByRole('button', { name: 'Switch language to English' }).length).toBeGreaterThanOrEqual(1)
    expect(document.documentElement).toHaveAttribute('lang', 'th')
    expect(window.localStorage.getItem('lostlink-language')).toBe('th')
  })
})
