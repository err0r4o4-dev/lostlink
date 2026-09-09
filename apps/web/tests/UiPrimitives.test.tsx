import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Search } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { Button, EmptyState, SearchField } from '../src/components/ui'
import { ItemCard } from '../src/components/item-card'
import { NotificationItem } from '../src/components/notification-item'
import { TrackingTimeline } from '../src/components/tracking-timeline'

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

  it('uses one canonical item card for public-safe item summaries', () => {
    render(<MemoryRouter><ItemCard item={{ id: 'synthetic-item', reportType: 'found', title: 'Synthetic test item', location: 'Campus area' }} /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /Synthetic test item/ })).toHaveAttribute('href', '/items/synthetic-item')
    expect(screen.getByText('found')).toBeInTheDocument()
  })

  it('distinguishes unread notifications without relying on color alone', () => {
    render(<MemoryRouter><NotificationItem read={false} title="Synthetic update" message="Test message" timestamp="Now" relatedPath="/tracking" /></MemoryRouter>)
    expect(screen.getByText('Unread')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Synthetic update/ })).toHaveAttribute('href', '/tracking')
  })

  it('renders supplied tracking events without creating workflow data', () => {
    render(<TrackingTimeline events={[{ title: 'Synthetic event', status: 'current', occurredAt: 'Test time' }]} />)
    expect(screen.getByRole('list', { name: 'Tracking timeline' })).toHaveTextContent('Synthetic event')
  })
})
