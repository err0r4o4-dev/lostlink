import { forwardRef, type HTMLAttributes } from 'react'

import { cn } from '../../lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, elevated = false, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-card border border-border bg-surface',
        elevated ? 'shadow-floating' : 'shadow-card',
        className,
      )}
      {...props}
    />
  )
})
