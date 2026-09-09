import { Paperclip } from 'lucide-react'
import { Link } from 'react-router-dom'

interface BrandMarkProps {
  compact?: boolean
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <Link to="/" className="group inline-flex min-h-11 items-center gap-3 rounded-control" aria-label="LostLink home">
      <span className="ui-transition flex size-11 items-center justify-center rounded-control bg-brand text-on-brand shadow-card group-hover:bg-brand-hover">
        <Paperclip aria-hidden="true" className="size-6" strokeWidth={2.25} />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-card font-bold tracking-tight text-brand">LostLink</span>
          <span className="mt-1 block text-label font-medium text-text-secondary">Find what matters</span>
        </span>
      )}
    </Link>
  )
}
