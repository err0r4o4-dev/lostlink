import { Bell, CircleHelp, Clock3, FileCheck2, Map, MapPin, Search, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { FormEvent, useState } from 'react'

import { Button, Card, EmptyState, Input, IntegrationNotice, Notice, PageContainer, PageHeader, StatusBadge } from '../components/ui'
import { RouteCard } from '../components/route-card'

const processGuide = [
  ['Report submitted', 'The Go API will create and validate an authoritative report record.'],
  ['Potential match found', 'Matching may surface candidates without deciding ownership.'],
  ['Claim and verification', 'Private evidence and authorization remain separate from matching.'],
  ['Staff review and return', 'Authorized review, pickup, return, and closure complete the process.'],
]

export function TrackingPage() {
  const [reference, setReference] = useState('')
  const [requested, setRequested] = useState(false)
  function submit(event: FormEvent) { event.preventDefault(); setRequested(true) }
  return (
    <PageContainer>
      <PageHeader eyebrow="Your activity" title="Track a report or claim" description="Authoritative status events will come from the Go workflow service after authentication and authorization." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Card className="p-5 md:p-6"><form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Input label="Report or claim reference" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Enter an opaque reference" /></div><Button type="submit">Check status</Button></form></Card>
          {requested ? <EmptyState icon={Clock3} title="Tracking integration pending" description="No status request was sent because authenticated tracking endpoints are not implemented." /> : <Card className="p-5 md:p-7"><h2 className="text-section font-semibold">Process guide</h2><ol className="mt-6 space-y-5">{processGuide.map(([title, detail], index) => <li className="grid grid-cols-[2.75rem_1fr] gap-4" key={title}><span className="flex size-11 items-center justify-center rounded-pill bg-brand-soft text-caption font-semibold text-brand">{index + 1}</span><div><h3 className="text-card font-semibold">{title}</h3><p className="mt-1 text-caption text-text-secondary">{detail}</p></div></li>)}</ol></Card>}
        </div>
        <IntegrationNotice capability="Authenticated tracking history and current workflow state" />
      </div>
    </PageContainer>
  )
}

export function NotificationsPage() {
  return <PageContainer><PageHeader eyebrow="Updates" title="Notifications" description="Review authorized report, match, claim, and return updates in one place." /><EmptyState icon={Bell} title="No notifications loaded" description="Notification delivery, read state, timestamps, and related-item links require authenticated API support." /><div className="mt-5"><IntegrationNotice capability="Notifications and mark-read actions" /></div></PageContainer>
}

export function ProfilePage() {
  return (
    <PageContainer>
      <PageHeader eyebrow="Account" title="Profile and preferences" description="Account identity and settings remain unavailable until the authentication contract is implemented." />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 md:p-6"><UserRound aria-hidden="true" className="size-8 text-brand" /><h2 className="mt-5 text-card font-semibold">Account identity</h2><p className="mt-2 text-caption text-text-secondary">No authenticated account fields are available.</p><div className="mt-5"><StatusBadge>Signed out</StatusBadge></div></Card>
        <Card className="p-5 md:p-6"><Bell aria-hidden="true" className="size-8 text-brand" /><h2 className="mt-5 text-card font-semibold">Notification settings</h2><p className="mt-2 text-caption text-text-secondary">Preferences will appear only when their server-side purpose and defaults are approved.</p></Card>
        <Card className="p-5 md:p-6"><ShieldCheck aria-hidden="true" className="size-8 text-brand" /><h2 className="mt-5 text-card font-semibold">Privacy controls</h2><p className="mt-2 text-caption text-text-secondary">Retention, deletion, session, and data-access controls require authoritative backend policy.</p></Card>
      </div>
      <section className="mt-8" aria-labelledby="profile-destinations"><h2 id="profile-destinations" className="mb-5 text-section font-semibold">More destinations</h2><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"><RouteCard to="/notifications" icon={Bell} title="Notifications" description="Review account-related updates when authentication is available." /><RouteCard to="/matches" icon={Sparkles} title="Potential matches" description="Explore similarity-assisted discovery without treating it as proof." /><RouteCard to="/verification" icon={FileCheck2} title="Verification guide" description="Understand how private evidence and human review stay separate." /><RouteCard to="/help" icon={CircleHelp} title="Help and safety" description="Read guidance grounded in the approved product architecture." /></div></section>
      <div className="mt-5"><IntegrationNotice capability="Authenticated profile, preferences, history, and privacy actions" /></div>
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
