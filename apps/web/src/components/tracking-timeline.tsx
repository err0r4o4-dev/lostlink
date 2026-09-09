import { CheckCircle2, Clock3 } from 'lucide-react'

import { Localize } from '../i18n/language'

export interface TrackingEvent {
  detail?: string
  occurredAt?: string
  status: 'complete' | 'current' | 'upcoming'
  title: string
}

export function TrackingTimeline({ events }: { events: TrackingEvent[] }) {
  return <Localize><ol aria-label="Tracking timeline" className="space-y-5">{events.map((event) => <li key={`${event.title}-${event.occurredAt ?? event.status}`} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4"><span className={`flex size-11 items-center justify-center rounded-pill ${event.status === 'complete' ? 'bg-success/10 text-success-strong' : event.status === 'current' ? 'bg-brand-soft text-brand' : 'bg-surface-secondary text-text-secondary'}`}><span className="sr-only">{event.status}</span>{event.status === 'complete' ? <CheckCircle2 aria-hidden="true" className="size-5" /> : <Clock3 aria-hidden="true" className="size-5" />}</span><div><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-card font-semibold">{event.title}</h3>{event.occurredAt && <time className="text-label text-text-secondary">{event.occurredAt}</time>}</div>{event.detail && <p className="mt-1 text-caption text-text-secondary">{event.detail}</p>}</div></li>)}</ol></Localize>
}
