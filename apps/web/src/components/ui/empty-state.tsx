import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-border bg-surface-secondary px-6 py-10 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-control bg-surface text-brand shadow-card">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h3 className="text-card font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 max-w-md text-caption text-text-secondary">{description}</p>
    </div>
  )
}
