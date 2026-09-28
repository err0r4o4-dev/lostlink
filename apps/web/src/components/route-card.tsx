import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card } from './ui'
import { Localize } from '../i18n/language'

interface RouteCardProps {
  description: string
  icon: LucideIcon
  title: string
  to: string
}

export function RouteCard({ description, icon: Icon, title, to }: RouteCardProps) {
  return (
    <Localize><Card className="ui-transition group h-full overflow-hidden hover:-translate-y-1 hover:border-brand/15 hover:shadow-floating">
      <Link to={to} className="flex h-full flex-col rounded-control">
        <span aria-hidden="true" className="h-1 w-full bg-gradient-to-r from-brand via-brand/45 to-info/30" />
        <span className="flex flex-1 flex-col p-5 md:p-7">
          <span className="flex size-12 items-center justify-center rounded-control bg-brand-soft text-brand shadow-card">
            <Icon aria-hidden="true" className="size-6" />
          </span>
          <h2 className="mt-5 text-card font-bold text-text-primary group-hover:text-brand">{title}</h2>
          <p className="mt-2 flex-1 text-caption text-text-secondary">{description}</p>
          <span className="mt-6 inline-flex items-center gap-2 text-caption font-semibold text-brand">Open <ArrowRight aria-hidden="true" className="ui-transition size-4 group-hover:translate-x-1" /></span>
        </span>
      </Link>
    </Card></Localize>
  )
}
