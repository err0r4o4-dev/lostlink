import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Search } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { Button, EmptyState, SearchField } from '../src/components/ui'

describe('UI primitives', () => {
  it('keeps Button semantic and keyboard activatable', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={onClick}>Continue</Button>)
    const button = screen.getByRole('button', { name: 'Continue' })

    button.focus()
    await user.keyboard('{Enter}')

    expect(button).toHaveAttribute('type', 'button')
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('gives the search input an accessible label', () => {
    render(<SearchField label="Search reports" placeholder="Search" />)

    expect(screen.getByRole('searchbox', { name: 'Search reports' })).toBeInTheDocument()
  })

  it('renders an informative empty state without interactive semantics', () => {
    render(<EmptyState icon={Search} title="Nothing here" description="Try again later." />)

    expect(screen.getByRole('heading', { level: 3, name: 'Nothing here' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
