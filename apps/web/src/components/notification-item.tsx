import { Bell, ChevronRight, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '../lib/utils'
import { Localize } from '../i18n/language'

export interface NotificationItemProps {
  message: string
  onOpen?: () => void
  read: boolean
  relatedPath?: string
  timestamp: string
  title: string
  icon?: LucideIcon
}

export function NotificationItem({ icon: Icon = Bell, message, onOpen, read, relatedPath, timestamp, title }: NotificationItemProps) {
  const content = <><span className={cn('flex size-11 shrink-0 items-center justify-center rounded-control', read ? 'bg-surface-secondary text-text-secondary' : 'bg-brand-soft text-brand')}><Icon aria-hidden="true" className="size-5" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center justify-between gap-2"><span className="text-caption font-semibold text-text-primary">{title}</span><time className="text-label text-text-secondary">{timestamp}</time></span><span className="mt-1 block text-caption text-text-secondary">{message}</span></span>{!read && <span className="mt-2 size-2 shrink-0 rounded-pill bg-brand"><span className="sr-only">Unread</span></span>}{relatedPath && <ChevronRight aria-hidden="true" className="mt-3 size-4 shrink-0 text-text-tertiary" />}</>
  const className = cn('ui-transition flex min-h-20 gap-3 rounded-card border border-border p-4 shadow-card hover:-translate-y-0.5 hover:shadow-floating', read ? 'bg-surface' : 'bg-brand-soft/40')
  return <Localize>{relatedPath ? <Link to={relatedPath} onClick={onOpen} className={className}>{content}</Link> : onOpen ? <button type="button" onClick={onOpen} className={`${className} w-full text-left`}>{content}</button> : <div className={className}>{content}</div>}</Localize>
}
