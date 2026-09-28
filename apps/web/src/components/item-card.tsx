import { ArrowRight, Backpack, CalendarDays, CreditCard, Headphones, Image as ImageIcon, KeyRound, MapPin, PackageSearch } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card, StatusBadge } from './ui'
import { Localize } from '../i18n/language'

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

function itemIcon(item: ItemSummary) {
  const value = `${item.title} ${item.category ?? ''}`.toLowerCase()
  if (value.includes('backpack') || value.includes('bag') || value.includes('กระเป๋า')) return Backpack
  if (value.includes('card') || value.includes('id') || value.includes('บัตร')) return CreditCard
  if (value.includes('key') || value.includes('กุญแจ')) return KeyRound
  if (value.includes('airpod') || value.includes('headphone') || value.includes('หูฟัง')) return Headphones
  return PackageSearch
}

export function ItemArtwork({ item, compact = false }: { compact?: boolean; item: ItemSummary }) {
  const Icon = itemIcon(item)
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-brand-soft/55 via-surface-secondary to-info/10 ${compact ? 'min-h-24' : 'aspect-[16/10]'}`}>
      <span aria-hidden="true" className="absolute -left-8 top-5 size-24 rounded-pill bg-brand-soft/65 blur-2xl" />
      <span aria-hidden="true" className="absolute -right-6 bottom-0 size-28 rounded-pill bg-info/10 blur-2xl" />
      {item.imageUrl ? (
        <img src={item.imageUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className={`relative flex items-center justify-center rounded-overlay border border-white/80 bg-surface/88 text-text-secondary shadow-floating ${compact ? 'size-16' : 'size-24'}`}>
          <Icon aria-hidden="true" className={compact ? 'size-8' : 'size-12'} strokeWidth={1.45} />
          <ImageIcon aria-hidden="true" className="absolute -bottom-2 -right-2 size-6 rounded-small bg-brand-soft p-1 text-brand" />
        </span>
      )}
    </div>
  )
}

export function ItemCard({ item }: { item: ItemSummary }) {
  return (
    <Localize><Card className="ui-transition group overflow-hidden hover:-translate-y-1 hover:shadow-floating">
      <Link className="block rounded-card" to={`/items/${encodeURIComponent(item.id)}`}>
        <ItemArtwork item={item} />
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
          <span className="mt-5 flex min-h-10 items-center justify-center gap-2 rounded-control border border-brand/10 bg-brand-soft/45 text-caption font-semibold text-brand">View details <ArrowRight aria-hidden="true" className="ui-transition size-4 group-hover:translate-x-1" /></span>
        </div>
      </Link>
    </Card></Localize>
  )
}
