import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from '../src/App'

describe('App', () => {
  it('explains that matching does not prove ownership', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: /lost items deserve/i })).toBeInTheDocument()
    expect(screen.getByText(/similarity assists discovery/i)).toBeInTheDocument()
    expect(screen.getByText(/verification stays private/i)).toBeInTheDocument()
  })
})

