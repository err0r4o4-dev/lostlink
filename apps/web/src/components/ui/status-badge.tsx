import type { ReactNode } from 'react'

import { Badge } from './badge'

interface StatusBadgeProps {
  children: ReactNode
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'info'
}

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return <Badge variant={tone}>{children}</Badge>
}
