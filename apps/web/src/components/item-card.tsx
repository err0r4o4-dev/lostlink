import { CalendarDays, Image as ImageIcon, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card, StatusBadge } from './ui'

export interface ItemSummary {
  category?: string
  dateLabel?: string
  id: string
  imageUrl?: string
  location?: string
  matchScore?: number
  reportType: 'lost' | 'found'
  status?: string
  title: string
}

export function ItemCard({ item }: { item: ItemSummary }) {
  return (
    <Card className="ui-transition group overflow-hidden hover:shadow-floating">
      <Link className="block rounded-card" to={`/items/${encodeURIComponent(item.id)}`}>
        <div className="flex aspect-video items-center justify-center bg-surface-secondary">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon aria-hidden="true" className="size-8 text-text-tertiary" />
          )}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={item.reportType === 'lost' ? 'brand' : 'info'}>{item.reportType}</StatusBadge>
            {item.status && <StatusBadge>{item.status}</StatusBadge>}
            {item.matchScore !== undefined && <StatusBadge tone="warning">Match score {Math.round(item.matchScore)}%</StatusBadge>}
          </div>
          <h3 className="mt-4 text-card font-semibold text-text-primary group-hover:text-brand">{item.title}</h3>
          {item.category && <p className="mt-1 text-caption text-text-secondary">{item.category}</p>}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-label text-text-secondary">
            {item.location && <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-4" />{item.location}</span>}
            {item.dateLabel && <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-4" />{item.dateLabel}</span>}
          </div>
        </div>
      </Link>
    </Card>
  )
}
