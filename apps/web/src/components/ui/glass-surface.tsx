import { forwardRef, type HTMLAttributes } from 'react'

import { cn } from '../../lib/utils'

export const GlassSurface = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function GlassSurface(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn('glass-panel border', className)} {...props} />
})
