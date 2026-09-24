import { Bell, CircleHelp, Clock3, FileCheck2, Map, MapPin, Search, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button, Card, EmptyState, ErrorState, Input, IntegrationNotice, LoadingState, Notice, PageContainer, PageHeader, StatusBadge } from '../components/ui'
import { NotificationItem } from '../components/notification-item'
import { RouteCard } from '../components/route-card'
import { TrackingTimeline } from '../components/tracking-timeline'
import { apiErrorMessage } from '../api/error'
import { useAuth } from '../features/auth/auth-state'
import { getCurrentUser } from '../features/auth/auth-api'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../features/notifications/notification-api'
import { getReturnArrangement, getTrackingTimeline } from '../features/tracking/tracking-api'
import { useLanguage } from '../i18n/language'
import { showAlert } from '../lib/alert'

const processGuide = [
  ['Report submitted', 'The Go API creates and validates an authoritative report record.'],
  ['Potential match found', 'Matching may surface candidates without deciding ownership.'],
  ['Claim and verification', 'Private evidence and authorization remain separate from matching.'],
  ['Staff review and return', 'Authorized review, pickup, return, and closure complete the process.'],
]

export function TrackingPage() {
  const { request } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeReference = searchParams.get('reference') ?? ''
  const [reference, setReference] = useState(activeReference)
  const timeline = useQuery({ queryKey: ['tracking', activeReference], queryFn: () => getTrackingTimeline(request, activeReference), enabled: Boolean(activeReference) })
  const returnDetails = useQuery({ queryKey: ['return-arrangement', activeReference], queryFn: () => getReturnArrangement(request, activeReference), enabled: timeline.data?.timeline.reference_type === 'return' })
  function submit(event: FormEvent) { event.preventDefault(); setSearchParams(reference.trim() ? { reference: reference.trim() } : {}) }
  return (
    <PageContainer>
      <PageHeader eyebrow="Your activity" title="Track a report, claim, or return" description="Load the authoritative timeline visible to the active account." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Card className="p-5 md:p-6"><form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Input label="Report or claim reference" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Enter an opaque reference" /></div><Button type="submit">Check status</Button></form></Card>
          {!activeReference && <Card className="p-5 md:p-7"><h2 className="text-section font-semibold">Process guide</h2><ol className="mt-6 space-y-5">{processGuide.map(([title, detail], index) => <li className="grid grid-cols-[2.75rem_1fr] gap-4" key={title}><span className="flex size-11 items-center justify-center rounded-pill bg-brand-soft text-caption font-semibold text-brand">{index + 1}</span><div><h3 className="text-card font-semibold">{title}</h3><p className="mt-1 text-caption text-text-secondary">{detail}</p></div></li>)}</ol></Card>}
          {timeline.isPending && activeReference && <LoadingState label="Loading tracking timeline" />}
          {timeline.isError && <ErrorState title="Timeline unavailable" description="The reference was not found or is not visible to the active account." onRetry={() => void timeline.refetch()} />}
          {timeline.data && <Card className="p-5 md:p-7"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-caption font-semibold text-brand">{timeline.data.timeline.reference_type}</p><h2 className="mt-1 text-section font-semibold">{timeline.data.timeline.current_status.replaceAll('_', ' ')}</h2></div><StatusBadge>{timeline.data.timeline.current_status}</StatusBadge></div><TrackingTimeline events={timeline.data.timeline.events.map((event, index, events) => ({ title: event.event_type.replaceAll('_', ' '), detail: event.message, occurredAt: new Date(event.created_at).toLocaleString(), status: index === events.length - 1 ? 'current' : 'complete' }))} /></Card>}
          {returnDetails.isError && <ErrorState title="Pickup details unavailable" description="The private return arrangement could not be loaded." onRetry={() => void returnDetails.refetch()} />}
          {returnDetails.data && <Card className="p-5 md:p-7"><h2 className="text-card font-semibold">Private pickup arrangement</h2><dl className="mt-5 space-y-4 text-caption"><div><dt className="font-semibold text-text-secondary">Status</dt><dd className="mt-1">{returnDetails.data.return_arrangement.status}</dd></div><div><dt className="font-semibold text-text-secondary">Pickup time</dt><dd className="mt-1">{returnDetails.data.return_arrangement.pickup_at ? new Date(returnDetails.data.return_arrangement.pickup_at).toLocaleString() : 'Not scheduled'}</dd></div><div><dt className="font-semibold text-text-secondary">Pickup location</dt><dd className="mt-1">{returnDetails.data.return_arrangement.pickup_location ?? 'Not scheduled'}</dd></div></dl></Card>}
        </div>
        <Notice title="Private workflow">Unknown or unauthorized references return a generic unavailable state to avoid exposing another user’s records.</Notice>
      </div>
    </PageContainer>
  )
}

export function NotificationsPage() {
  const { request } = useAuth()
  const queryClient = useQueryClient()
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: () => listNotifications(request) })
  const markRead = useMutation({ mutationFn: (id: string) => markNotificationRead(request, id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) })
  const markAll = useMutation({ mutationFn: () => markAllNotificationsRead(request), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) })
  const unread = notifications.data?.notifications.filter((notification) => !notification.read_at).length ?? 0
  return <PageContainer><PageHeader eyebrow="Updates" title="Notifications" description="Review authorized report, match, claim, and return updates in one place." actions={<Button variant="secondary" disabled={!unread || markAll.isPending} onClick={() => markAll.mutate()}>{markAll.isPending ? 'Marking…' : 'Mark all read'}</Button>} />{notifications.isPending && <LoadingState label="Loading notifications" />}{notifications.isError && <ErrorState title="Notifications unavailable" description="Notifications could not be loaded." onRetry={() => void notifications.refetch()} />}{notifications.data && !notifications.data.notifications.length && <EmptyState icon={Bell} title="No notifications" description="Workflow updates will appear here when reports, claims, or returns change state." />}{notifications.data && notifications.data.notifications.length > 0 && <div className="space-y-3">{notifications.data.notifications.map((notification) => <NotificationItem key={notification.id} title={notification.title} message={notification.message} timestamp={new Date(notification.created_at).toLocaleString()} read={Boolean(notification.read_at)} relatedPath={notification.related_path} onOpen={() => { if (!notification.read_at) markRead.mutate(notification.id) }} />)}</div>}{(markRead.isError || markAll.isError) && <div className="mt-5"><Notice announce title="Notification action failed" tone="error">{apiErrorMessage(markRead.error ?? markAll.error, 'The notification could not be updated.')}</Notice></div>}</PageContainer>
}

export function ProfilePage() {
  const { logout, request, user } = useAuth()
  const { translate } = useLanguage()
  const navigate = useNavigate()
  const currentUser = useQuery({ queryKey: ['auth', 'me'], queryFn: () => getCurrentUser(request) })
  const profile = currentUser.data?.user ?? user

  async function signOut() {
    const confirmed = await showAlert.confirm(
      translate('Sign out?'),
      translate('You will need to sign in again to access private LostLink features.'),
      translate('Sign out'),
      translate('Stay signed in'),
    )
    if (!confirmed) return

    try {
      await logout()
      await showAlert.success(translate('Signed out'), translate('Your LostLink session has ended.'))
    } catch {
      await showAlert.error(
        translate('Sign-out incomplete'),
        translate('The local session was cleared, but the server could not confirm logout. Close the browser if this is a shared device.'),
      )
    } finally {
      void navigate('/login', { replace: true })
    }
  }

  return (
    <PageContainer>
      <PageHeader eyebrow="Account" title="Profile and preferences" description="Review the public-safe identity attached to your active LostLink session." actions={<Button onClick={() => void signOut()} variant="secondary">Sign out</Button>} />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 md:p-6"><UserRound aria-hidden="true" className="size-8 text-brand" /><h2 className="mt-5 text-card font-semibold">Account identity</h2>{currentUser.isPending ? <div className="mt-4"><LoadingState label="Loading account" /></div> : <><p className="mt-2 break-all text-caption text-text-secondary">{profile?.identifier}</p><div className="mt-5"><StatusBadge>{profile?.role ?? 'user'}</StatusBadge></div></>}{currentUser.isError && <p className="mt-3 text-caption text-error-strong">The account could not be refreshed from the server.</p>}</Card>
        <Card className="p-5 md:p-6"><Bell aria-hidden="true" className="size-8 text-brand" /><h2 className="mt-5 text-card font-semibold">Notification settings</h2><p className="mt-2 text-caption text-text-secondary">Preferences will appear only when their server-side purpose and defaults are approved.</p></Card>
        <Card className="p-5 md:p-6"><ShieldCheck aria-hidden="true" className="size-8 text-brand" /><h2 className="mt-5 text-card font-semibold">Privacy controls</h2><p className="mt-2 text-caption text-text-secondary">Retention, deletion, session, and data-access controls require authoritative backend policy.</p></Card>
      </div>
      <section className="mt-8" aria-labelledby="profile-destinations"><h2 id="profile-destinations" className="mb-5 text-section font-semibold">More destinations</h2><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"><RouteCard to="/notifications" icon={Bell} title="Notifications" description="Review account-related workflow updates and mark them as read." /><RouteCard to="/matches" icon={Sparkles} title="Potential matches" description="Run similarity-assisted discovery without treating it as proof." /><RouteCard to="/claims" icon={FileCheck2} title="My claims" description="Review private evidence, staff decisions, and claim status." /><RouteCard to="/report" icon={Clock3} title="My reports" description="Manage reports, images, withdrawal, and matching entry points." /></div></section>
      <div className="mt-5"><IntegrationNotice capability="Profile preferences, account history, and privacy actions" /></div>
    </PageContainer>
  )
}

const faqs = [
  ['How does matching work?', 'Image and text similarity may rank public-safe lost and found reports as potential matches. It does not prove ownership.'],
  ['How is ownership verified?', 'Private ownership evidence is handled in a separate authorized flow and reviewed according to Go-owned policy.'],
  ['Why are some locations approximate?', 'Coarse location information supports discovery while reducing unnecessary exposure of sensitive report details.'],
  ['Can the browser contact the AI service directly?', 'No. The Go API owns authorization, validation, workflow state, and safe public response shaping.'],
  ['What completes a return?', 'The planned lifecycle includes staff review, pickup, return, and closure rather than ending at a similarity result.'],
]

export function HelpPage() {
  return (
    <PageContainer>
      <PageHeader eyebrow="Help and safety" title="LostLink guide" description="Plain-language answers based on the approved architecture, privacy boundaries, and product lifecycle." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">{faqs.map(([question, answer]) => <details key={question} className="group rounded-card border border-border bg-surface p-5 shadow-card"><summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-card font-semibold"><span>{question}</span><CircleHelp aria-hidden="true" className="ui-transition size-5 shrink-0 text-brand group-open:rotate-45" /></summary><p className="mt-3 text-caption text-text-secondary">{answer}</p></details>)}</div>
        <aside className="space-y-4"><Notice title="Safety first" tone="warning">Do not publish contact details, private verification answers, receipts, serial secrets, or pickup arrangements.</Notice><Card className="p-5"><h2 className="text-card font-semibold">Need a workflow?</h2><p className="mt-2 text-caption text-text-secondary">Start from Search, Report, Matching, or Tracking in the main navigation.</p></Card></aside>
      </div>
    </PageContainer>
  )
}

export function LocationsPage() {
  return (
    <PageContainer>
      <PageHeader eyebrow="Campus locations" title="Explore approximate areas" description="The location surface is ready for an approved provider or coarse-location API without simulating live map data." />
      <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Card className="p-5 md:p-6"><div className="flex items-center gap-3"><Search aria-hidden="true" className="size-5 text-brand" /><h2 className="text-card font-semibold">Find an area</h2></div><div className="mt-5"><Input label="Campus area" placeholder="Search is unavailable" disabled /></div><div className="mt-5"><IntegrationNotice capability="Approved campus locations and map search" /></div></Card>
        <Card className="flex min-h-96 flex-col items-center justify-center bg-surface-secondary p-6 text-center"><span className="flex size-14 items-center justify-center rounded-feature bg-surface text-brand shadow-card"><Map aria-hidden="true" className="size-7" /></span><h2 className="mt-5 text-section font-semibold">Map provider not configured</h2><p className="mt-2 max-w-lg text-caption text-text-secondary">No live pins, routes, coordinates, or provider behavior are being simulated.</p><span className="mt-5 inline-flex items-center gap-2 text-caption font-semibold text-brand"><MapPin aria-hidden="true" className="size-4" />Approximate locations only</span></Card>
      </div>
    </PageContainer>
  )
}
