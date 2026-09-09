import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '../lib/utils'
import { Localize } from '../i18n/language'

export interface NotificationItemProps {
  message: string
  read: boolean
  relatedPath?: string
  timestamp: string
  title: string
}

export function NotificationItem({ message, read, relatedPath, timestamp, title }: NotificationItemProps) {
  const content = <><span className={cn('flex size-11 shrink-0 items-center justify-center rounded-control', read ? 'bg-surface-secondary text-text-secondary' : 'bg-brand-soft text-brand')}><Bell aria-hidden="true" className="size-5" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><span className="text-caption font-semibold text-text-primary">{title}</span><time className="text-label text-text-secondary">{timestamp}</time></span><span className="mt-1 block text-caption text-text-secondary">{message}</span></span>{!read && <span className="mt-2 size-2 shrink-0 rounded-pill bg-brand"><span className="sr-only">Unread</span></span>}</>
  const className = cn('ui-transition flex min-h-20 gap-3 rounded-card border border-border p-4', read ? 'bg-surface' : 'bg-brand-soft/40')
  return <Localize>{relatedPath ? <Link to={relatedPath} className={className}>{content}</Link> : <div className={className}>{content}</div>}</Localize>
}
