import { Paperclip } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Localize } from '../i18n/language'

interface BrandMarkProps {
  compact?: boolean
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <Localize><Link to="/" className="group inline-flex min-h-11 items-center gap-3 rounded-control" aria-label="LostLink home">
      <span className="ui-transition relative flex size-11 items-center justify-center overflow-hidden rounded-control bg-brand text-on-brand shadow-floating group-hover:bg-brand-hover">
        <span aria-hidden="true" className="absolute inset-x-1 top-0 h-px bg-white/70" />
        <Paperclip aria-hidden="true" className="size-6" strokeWidth={2.25} />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-card font-bold tracking-tight text-brand">LostLink</span>
          <span className="mt-1 block text-label font-medium text-text-secondary">Find what matters</span>
        </span>
      )}
    </Link></Localize>
  )
}
