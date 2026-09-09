import { render, screen } from '@testing-library/react'
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

  it('marks unavailable workflows as unavailable instead of inventing behavior', () => {
    render(<App />)

    expect(screen.getByRole('searchbox', { name: /search lostlink/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /report a lost item/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /report a found item/i })).toBeDisabled()
    expect(screen.getByText(/no public items yet/i)).toBeInTheDocument()
  })

  it('exposes skip and section navigation landmarks', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main-content')
    expect(screen.getAllByRole('navigation').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByRole('link', { name: 'Safety' }).length).toBeGreaterThanOrEqual(2)
  })
})
