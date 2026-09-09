import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card } from './ui'

interface RouteCardProps {
  description: string
  icon: LucideIcon
  title: string
  to: string
}

export function RouteCard({ description, icon: Icon, title, to }: RouteCardProps) {
  return (
    <Card className="ui-transition group h-full p-5 hover:shadow-floating md:p-6">
      <Link to={to} className="flex h-full flex-col rounded-control">
        <span className="flex size-11 items-center justify-center rounded-control bg-brand-soft text-brand">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <h2 className="mt-5 text-card font-semibold text-text-primary group-hover:text-brand">{title}</h2>
        <p className="mt-2 flex-1 text-caption text-text-secondary">{description}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-caption font-semibold text-brand">Open <ArrowRight aria-hidden="true" className="size-4" /></span>
      </Link>
    </Card>
  )
}
