import { AlertCircle, CheckCircle2, Clock3, LoaderCircle, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../../lib/utils'
import { Localize } from '../../i18n/language'
import { Button } from './button'

interface NoticeProps {
  announce?: boolean
  children: ReactNode
  title: string
  tone?: 'info' | 'warning' | 'success' | 'error'
}

const noticeStyles = {
  info: { icon: Clock3, className: 'bg-info/10 text-info-strong' },
  warning: { icon: AlertCircle, className: 'bg-warning/10 text-text-primary' },
  success: { icon: CheckCircle2, className: 'bg-success/10 text-success-strong' },
  error: { icon: AlertCircle, className: 'bg-error/10 text-error-strong' },
}

export function Notice({ announce = false, children, title, tone = 'info' }: NoticeProps) {
  const { className, icon: Icon } = noticeStyles[tone]
  return (
    <Localize><div
      className={cn('flex gap-3 rounded-card p-4 text-caption', className)}
      role={tone === 'error' ? 'alert' : announce ? 'status' : undefined}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div><p className="font-semibold">{title}</p><div className="mt-1 leading-6">{children}</div></div>
    </div></Localize>
  )
}

export function IntegrationNotice({ announce = false, capability }: { announce?: boolean; capability: string }) {
  return (
    <Notice announce={announce} title="Integration pending">
      {capability} is ready in the interface, but the public Go API contract has not been implemented. No production action will be simulated.
    </Notice>
  )
}

interface ErrorStateProps {
  description: string
  onRetry?: () => void
  title?: string
}

export function ErrorState({ description, onRetry, title = 'Something went wrong' }: ErrorStateProps) {
  return (
    <Localize><div className="rounded-card border border-error/20 bg-error/10 p-6 text-center" role="alert">
      <AlertCircle aria-hidden="true" className="mx-auto size-8 text-error-strong" />
      <h3 className="mt-3 text-card font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-caption text-text-secondary-strong">{description}</p>
      {onRetry && <Button className="mt-5" variant="secondary" onClick={onRetry}>Try again</Button>}
    </div></Localize>
  )
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <Localize><div className="flex min-h-40 items-center justify-center gap-3 rounded-card bg-surface-secondary text-caption text-text-secondary" role="status">
      <LoaderCircle aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />
      <span>{label}</span>
    </div></Localize>
  )
}

export function StateIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <span className="flex size-11 items-center justify-center rounded-control bg-brand-soft text-brand"><Icon aria-hidden="true" className="size-5" /></span>
}
