import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes } from 'react'

import { cn } from '../../lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-pill px-3 py-1 text-label font-semibold', {
  variants: {
    variant: {
      neutral: 'bg-surface-secondary text-text-secondary',
      brand: 'bg-brand-soft text-brand',
      success: 'bg-success/10 text-success-strong',
      warning: 'bg-warning/10 text-text-primary',
      info: 'bg-info/10 text-info-strong',
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
})

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant, ...props },
  ref,
) {
  return <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
})
