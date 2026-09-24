import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, ClipboardList, Download, FileSearch, History, RotateCcw, Scale, Sparkles, Truck, UsersRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { apiErrorMessage } from '../api/error'
import { RouteCard } from '../components/route-card'
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, Notice, PageContainer, PageHeader, Select, StatusBadge, Textarea, buttonVariants } from '../components/ui'
import {
  createReturnArrangement,
  decideClaim,
  getStaffClaim,
  getStaffDashboard,
  listAuditEvents,
  listStaffClaims,
  listStaffMatches,
  listStaffReports,
  listStaffReturns,
  moderateReport,
  reviewMatch,
  scheduleReturn,
  transitionReturn,
} from '../features/admin/admin-api'
import { useAuth } from '../features/auth/auth-state'
import { getClaimEvidenceContent } from '../features/claims/claim-api'
import { getReturnArrangement } from '../features/tracking/tracking-api'
import { useApiHealth } from '../features/system/use-api-health'
import { showAlert } from '../lib/alert'

function stringValue(values: FormData, key: string) {
  const value = values.get(key)
  return typeof value === 'string' ? value : ''
}

function ActionError({ error }: { error: unknown }) {
  if (!error) return null
  return <Notice announce title="Action failed" tone="error">{apiErrorMessage(error, 'The staff action could not be completed.')}</Notice>
}

export function StaffDashboardPage() {
  const { request, user } = useAuth()
  const health = useApiHealth()
  const dashboard = useQuery({ queryKey: ['staff', 'dashboard'], queryFn: () => getStaffDashboard(request) })
  const metrics = dashboard.data?.dashboard

  return (
    <PageContainer>
      <PageHeader eyebrow="Staff workspace" title="Operations dashboard" description="Server-authorized queues for moderation, verification, and accountable returns." />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{[
        ['Open reports', metrics?.open_reports],
        ['Potential matches', metrics?.potential_matches],
        ['Claims to review', metrics?.claims_to_review],
        ['Returns in progress', metrics?.returns_in_progress],
      ].map(([label, value]) => <Card className="p-5" key={String(label)}><p className="text-caption text-text-secondary">{label}</p><p className="mt-2 text-section font-semibold">{dashboard.isPending ? '…' : dashboard.isError ? 'Unavailable' : value}</p></Card>)}</div>
      {dashboard.isError && <div className="mt-5"><ErrorState title="Dashboard unavailable" description="Staff queue counts could not be loaded." onRetry={() => void dashboard.refetch()} /></div>}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"><RouteCard to="/staff/reports" icon={ClipboardList} title="Report queue" description="Moderate active or hidden reports." /><RouteCard to="/staff/matches" icon={Sparkles} title="Matching review" description="Review or dismiss similarity results." /><RouteCard to="/staff/claims" icon={Scale} title="Claim review" description="Inspect restricted evidence and decide claims." /><RouteCard to="/staff/returns" icon={Truck} title="Return workflow" description="Schedule pickup and complete item return." />{user?.role === 'admin' && <RouteCard to="/admin/audit-events" icon={History} title="Audit events" description="Review restricted workflow audit history." />}</div>
        <Card className="p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Activity aria-hidden="true" className="size-5 text-brand" /><h2 className="text-card font-semibold">Public API</h2></div>{health.isSuccess && <StatusBadge tone={health.data.status === 'ok' ? 'success' : 'warning'}>{health.data.status}</StatusBadge>}</div><div className="mt-5">{health.isPending ? <LoadingState label="Checking API health" /> : health.isError ? <ErrorState title="API unavailable" description="The public health endpoint could not be reached." onRetry={() => void health.refetch()} /> : <p className="text-caption text-text-secondary">The Go API is reachable. Product actions remain protected by server-side role and object authorization.</p>}</div></Card>
      </div>
    </PageContainer>
  )
}

export function StaffReportsPage() {
  const { request } = useAuth()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const reports = useQuery({ queryKey: ['staff', 'reports', status], queryFn: () => listStaffReports(request, status ? status as 'active' | 'hidden' | 'withdrawn' | 'closed' : undefined) })
  const moderate = useMutation({ mutationFn: ({ id, action }: { id: string; action: 'hide' | 'restore' | 'close' }) => moderateReport(request, id, action), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', 'reports'] }) })
  return <PageContainer><PageHeader eyebrow="Staff workspace" title="Report moderation" description="Review public-safe report data and apply server-audited lifecycle actions." actions={<Link to="/staff" className={buttonVariants({ variant: 'secondary' })}>Dashboard</Link>} /><div className="mb-5 max-w-sm"><Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="hidden">Hidden</option><option value="withdrawn">Withdrawn</option><option value="closed">Closed</option></Select></div>{reports.isPending && <LoadingState label="Loading report queue" />}{reports.isError && <ErrorState title="Queue unavailable" description="The report queue could not be loaded." onRetry={() => void reports.refetch()} />}{reports.data && !reports.data.reports.length && <EmptyState icon={FileSearch} title="No reports in this queue" description="Change the status filter or return later." />}{reports.data && <div className="space-y-3">{reports.data.reports.map((report) => <Card className="p-5" key={report.id}><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><div className="flex flex-wrap gap-2"><StatusBadge tone={report.report_type === 'lost' ? 'brand' : 'info'}>{report.report_type}</StatusBadge><StatusBadge>{report.status}</StatusBadge></div><h2 className="mt-3 text-card font-semibold">{report.item_name}</h2><p className="mt-1 text-caption text-text-secondary">{report.category} · {report.approximate_location}</p></div><div className="flex flex-wrap gap-2">{report.status === 'active' && <Button variant="secondary" onClick={() => moderate.mutate({ id: report.id, action: 'hide' })}>Hide</Button>}{report.status === 'hidden' && <Button variant="secondary" onClick={() => moderate.mutate({ id: report.id, action: 'restore' })}><RotateCcw aria-hidden="true" className="size-4" />Restore</Button>}{(report.status === 'active' || report.status === 'hidden') && <Button variant="secondary" onClick={() => moderate.mutate({ id: report.id, action: 'close' })}>Close</Button>}</div></div></Card>)}</div>}<div className="mt-5"><ActionError error={moderate.error} /></div></PageContainer>
}

export function StaffMatchesPage() {
  const { request } = useAuth()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('pending')
  const matches = useQuery({ queryKey: ['staff', 'matches', status], queryFn: () => listStaffMatches(request, status as 'pending' | 'reviewed' | 'dismissed') })
  const review = useMutation({ mutationFn: ({ id, action }: { id: string; action: 'review' | 'dismiss' }) => reviewMatch(request, id, action), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', 'matches'] }) })
  return <PageContainer><PageHeader eyebrow="Staff workspace" title="Matching review" description="Inspect similarity output without using it as an ownership decision." actions={<Link to="/staff" className={buttonVariants({ variant: 'secondary' })}>Dashboard</Link>} /><div className="mb-5 max-w-sm"><Select label="Review status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending">Pending</option><option value="reviewed">Reviewed</option><option value="dismissed">Dismissed</option></Select></div>{matches.isPending && <LoadingState label="Loading matching queue" />}{matches.isError && <ErrorState title="Queue unavailable" description="The matching queue could not be loaded." onRetry={() => void matches.refetch()} />}{matches.data && !matches.data.matches.length && <EmptyState icon={Sparkles} title="No matches in this queue" description="Change the review filter or return later." />}{matches.data && <div className="grid gap-4 md:grid-cols-2">{matches.data.matches.map((match) => <Card className="p-5" key={match.id}><div className="flex flex-wrap gap-2"><StatusBadge tone="warning">{Math.round(match.score * 100)}% similar</StatusBadge><StatusBadge>{match.review_status}</StatusBadge></div><h2 className="mt-4 text-card font-semibold">{match.candidate.item_name}</h2><p className="mt-2 text-caption text-text-secondary">{match.candidate.public_description}</p>{match.review_status === 'pending' && <div className="mt-5 flex gap-2"><Button onClick={() => review.mutate({ id: match.id, action: 'review' })}>Mark reviewed</Button><Button variant="secondary" onClick={() => review.mutate({ id: match.id, action: 'dismiss' })}>Dismiss</Button></div>}</Card>)}</div>}<div className="mt-5"><ActionError error={review.error} /></div></PageContainer>
}

export function StaffClaimsPage() {
  const { request } = useAuth()
  const [status, setStatus] = useState('')
  const claims = useQuery({ queryKey: ['staff', 'claims', status], queryFn: () => listStaffClaims(request, status ? status as Parameters<typeof listStaffClaims>[1] : undefined) })
  return <PageContainer><PageHeader eyebrow="Staff workspace" title="Claim review" description="Open restricted claims to inspect evidence and record accountable decisions." actions={<Link to="/staff" className={buttonVariants({ variant: 'secondary' })}>Dashboard</Link>} /><div className="mb-5 max-w-sm"><Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{['draft', 'submitted', 'under_review', 'needs_more_info', 'approved', 'rejected', 'cancelled'].map((value) => <option value={value} key={value}>{value.replaceAll('_', ' ')}</option>)}</Select></div>{claims.isPending && <LoadingState label="Loading claim queue" />}{claims.isError && <ErrorState title="Queue unavailable" description="The claim queue could not be loaded." onRetry={() => void claims.refetch()} />}{claims.data && !claims.data.claims.length && <EmptyState icon={UsersRound} title="No claims in this queue" description="Change the status filter or return later." />}{claims.data && <div className="grid gap-4 md:grid-cols-2">{claims.data.claims.map((claim) => <Card className="p-5" key={claim.id}><div className="flex flex-wrap gap-2"><StatusBadge>{claim.status}</StatusBadge><Badge>{claim.id}</Badge></div><p className="mt-4 text-caption text-text-secondary">Claimant {claim.claimant_id}</p><Link to={`/staff/claims/${encodeURIComponent(claim.id)}`} className={`${buttonVariants({ variant: 'secondary' })} mt-5`}>Review claim</Link></Card>)}</div>}</PageContainer>
}

export function StaffClaimDetailPage() {
  const { claimId } = useParams()
  const { request, requestBlob } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [reason, setReason] = useState('')
  const claim = useQuery({ queryKey: ['staff', 'claim', claimId], queryFn: () => getStaffClaim(request, claimId ?? ''), enabled: Boolean(claimId) })
  const decision = useMutation({ mutationFn: (action: 'start_review' | 'request_more_info' | 'approve' | 'reject') => decideClaim(request, claimId ?? '', action, reason.trim() || undefined), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff', 'claim', claimId] }) })
  const createReturn = useMutation({ mutationFn: () => createReturnArrangement(request, claimId ?? ''), onSuccess: async (data) => { await showAlert.success('Return workflow created', 'Pickup scheduling can now begin.'); void navigate(`/staff/returns/${encodeURIComponent(data.return_arrangement.id)}`) } })
  const downloadEvidence = useMutation({ mutationFn: async ({ evidenceId, contentType }: { evidenceId: string; contentType?: string }) => { const blob = await getClaimEvidenceContent(requestBlob, claimId ?? '', evidenceId); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `claim-evidence-${evidenceId}.${contentType === 'image/png' ? 'png' : 'jpg'}`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0) } })
  const value = claim.data?.claim
  const canDecide = value?.status === 'submitted' || value?.status === 'under_review'
  const decisionPending = decision.isPending || createReturn.isPending
  return <PageContainer><PageHeader eyebrow="Restricted review" title={value ? `Claim ${value.status.replaceAll('_', ' ')}` : 'Claim review'} description="Review private evidence independently from similarity scores." actions={<Link to="/staff/claims" className={buttonVariants({ variant: 'secondary' })}>Claim queue</Link>} />{claim.isPending && <LoadingState label="Loading restricted claim" />}{claim.isError && <ErrorState title="Claim unavailable" description="The claim could not be loaded for staff review." onRetry={() => void claim.refetch()} />}{value && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]"><div className="space-y-4">{value.evidence?.map((evidence) => <Card className="p-5" key={evidence.id}><div className="flex items-start justify-between gap-4"><div><StatusBadge>{evidence.evidence_type}</StatusBadge><p className="mt-3 whitespace-pre-wrap text-caption">{evidence.description}</p></div>{evidence.evidence_type === 'image' && <Button variant="ghost" disabled={downloadEvidence.isPending} onClick={() => downloadEvidence.mutate({ evidenceId: evidence.id, contentType: evidence.content_type })}><Download aria-hidden="true" className="size-4" />Download</Button>}</div></Card>)}</div><aside className="space-y-4"><StatusBadge>{value.status}</StatusBadge>{canDecide && <><Textarea label="Decision reason" value={reason} onChange={(event) => setReason(event.target.value)} description="Required when requesting more information or rejecting a claim; optional for approval." /><div className="grid gap-2">{value.status === 'submitted' && <Button disabled={decisionPending} onClick={() => decision.mutate('start_review')}>Start review</Button>}<Button variant="secondary" disabled={decisionPending || reason.trim().length < 3} onClick={() => decision.mutate('request_more_info')}>Request more information</Button><Button disabled={decisionPending} onClick={() => decision.mutate('approve')}>Approve claim</Button><Button variant="secondary" disabled={decisionPending || reason.trim().length < 3} onClick={() => decision.mutate('reject')}>Reject claim</Button></div></>}{value.status === 'needs_more_info' && <Notice title="Waiting for claimant response">The current API does not accept another staff decision from this state.</Notice>}{value.status === 'approved' && <Button className="w-full" disabled={createReturn.isPending} onClick={() => createReturn.mutate()}>{createReturn.isPending ? 'Creating…' : 'Create return arrangement'}</Button>}<Notice title="Decision boundary" tone="warning">Do not use the match score as ownership proof. Decisions must be grounded in restricted evidence and policy.</Notice><ActionError error={decision.error ?? createReturn.error ?? downloadEvidence.error} /></aside></div>}</PageContainer>
}

export function StaffReturnsPage() {
  const { request } = useAuth()
  const [status, setStatus] = useState('')
  const returns = useQuery({ queryKey: ['staff', 'returns', status], queryFn: () => listStaffReturns(request, status ? status as Parameters<typeof listStaffReturns>[1] : undefined) })
  return <PageContainer><PageHeader eyebrow="Staff workspace" title="Return arrangements" description="Schedule private pickup, confirm handoff, return the item, and close the workflow." actions={<Link to="/staff" className={buttonVariants({ variant: 'secondary' })}>Dashboard</Link>} /><div className="mb-5 max-w-sm"><Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{['scheduling', 'scheduled', 'picked_up', 'returned', 'closed', 'cancelled'].map((value) => <option value={value} key={value}>{value.replaceAll('_', ' ')}</option>)}</Select></div>{returns.isPending && <LoadingState label="Loading return arrangements" />}{returns.isError && <ErrorState title="Returns unavailable" description="Return arrangements could not be loaded." onRetry={() => void returns.refetch()} />}{returns.data && !returns.data.return_arrangements.length && <EmptyState icon={Truck} title="No returns in this queue" description="Change the status filter or return later." />}{returns.data && <div className="grid gap-4 md:grid-cols-2">{returns.data.return_arrangements.map((entry) => <Card className="p-5" key={entry.id}><div className="flex flex-wrap gap-2"><StatusBadge>{entry.status}</StatusBadge><Badge>{entry.id}</Badge></div><p className="mt-4 text-caption text-text-secondary">Claim {entry.claim_id}</p><Link to={`/staff/returns/${encodeURIComponent(entry.id)}`} className={`${buttonVariants({ variant: 'secondary' })} mt-5`}>Manage return</Link></Card>)}</div>}</PageContainer>
}

export function StaffReturnDetailPage() {
  const { returnId } = useParams()
  const { request } = useAuth()
  const queryClient = useQueryClient()
  const value = useQuery({ queryKey: ['return-arrangement', returnId], queryFn: () => getReturnArrangement(request, returnId ?? ''), enabled: Boolean(returnId) })
  const schedule = useMutation({ mutationFn: (input: { pickup_at: string; pickup_location: string; private_notes?: string }) => scheduleReturn(request, returnId ?? '', input), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['return-arrangement', returnId] }) })
  const transition = useMutation({ mutationFn: (action: 'confirm-pickup' | 'complete' | 'close' | 'cancel') => transitionReturn(request, returnId ?? '', action), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['return-arrangement', returnId] }) })
  function submitSchedule(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const values = new FormData(event.currentTarget); schedule.mutate({ pickup_at: new Date(stringValue(values, 'pickup_at')).toISOString(), pickup_location: stringValue(values, 'pickup_location'), private_notes: stringValue(values, 'private_notes') }) }
  const entry = value.data?.return_arrangement
  return <PageContainer><PageHeader eyebrow="Private handoff" title={entry ? `Return ${entry.status.replaceAll('_', ' ')}` : 'Return arrangement'} description="Pickup details are visible only to involved users and authorized staff." actions={<Link to="/staff/returns" className={buttonVariants({ variant: 'secondary' })}>Return queue</Link>} />{value.isPending && <LoadingState label="Loading return arrangement" />}{value.isError && <ErrorState title="Return unavailable" description="The return arrangement could not be loaded." onRetry={() => void value.refetch()} />}{entry && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]"><Card className="p-5 md:p-7"><div className="flex flex-wrap gap-2"><StatusBadge>{entry.status}</StatusBadge><Badge>{entry.id}</Badge></div><dl className="mt-6 grid gap-4 text-caption sm:grid-cols-2"><div><dt className="font-semibold text-text-secondary">Claim</dt><dd className="mt-1 break-all">{entry.claim_id}</dd></div><div><dt className="font-semibold text-text-secondary">Pickup time</dt><dd className="mt-1">{entry.pickup_at ? new Date(entry.pickup_at).toLocaleString() : 'Not scheduled'}</dd></div><div><dt className="font-semibold text-text-secondary">Pickup location</dt><dd className="mt-1">{entry.pickup_location ?? 'Not scheduled'}</dd></div><div><dt className="font-semibold text-text-secondary">Private notes</dt><dd className="mt-1 whitespace-pre-wrap">{entry.private_notes ?? 'None'}</dd></div></dl>{entry.status === 'scheduling' && <form className="mt-6 space-y-4" onSubmit={submitSchedule}><Input name="pickup_at" label="Pickup date and time" type="datetime-local" required /><Input name="pickup_location" label="Private pickup location" required minLength={2} maxLength={240} /><Textarea name="private_notes" label="Private staff notes" maxLength={1000} /><Button type="submit" disabled={schedule.isPending}>{schedule.isPending ? 'Scheduling…' : 'Schedule pickup'}</Button></form>}</Card><aside className="space-y-3">{entry.status === 'scheduled' && <Button className="w-full" onClick={() => transition.mutate('confirm-pickup')}>Confirm pickup</Button>}{entry.status === 'picked_up' && <Button className="w-full" onClick={() => transition.mutate('complete')}>Mark returned</Button>}{entry.status === 'returned' && <Button className="w-full" onClick={() => transition.mutate('close')}>Close workflow</Button>}{(entry.status === 'scheduling' || entry.status === 'scheduled') && <Button className="w-full" variant="secondary" onClick={() => transition.mutate('cancel')}>Cancel return</Button>}<Link to={`/tracking?reference=${encodeURIComponent(entry.id)}`} className={buttonVariants({ variant: 'secondary', className: 'w-full' })}>Open timeline</Link><ActionError error={schedule.error ?? transition.error} /></aside></div>}</PageContainer>
}

export function AuditEventsPage() {
  const { request } = useAuth()
  const events = useQuery({ queryKey: ['admin', 'audit-events'], queryFn: () => listAuditEvents(request) })
  return <PageContainer><PageHeader eyebrow="Administrator" title="Audit events" description="Restricted audit history for workflow actions and accountable review." actions={<Link to="/staff" className={buttonVariants({ variant: 'secondary' })}>Staff dashboard</Link>} />{events.isPending && <LoadingState label="Loading audit events" />}{events.isError && <ErrorState title="Audit unavailable" description="Audit events require an administrator role." onRetry={() => void events.refetch()} />}{events.data && !events.data.audit_events.length && <EmptyState icon={History} title="No audit events" description="Audited workflow actions will appear here." />}{events.data && <div className="space-y-3">{events.data.audit_events.map((event) => <Card className="p-5" key={event.id}><div className="flex flex-wrap items-center gap-2"><StatusBadge>{event.subject_type}</StatusBadge><span className="text-caption font-semibold">{event.action}</span><time className="ml-auto text-label text-text-secondary">{new Date(event.created_at).toLocaleString()}</time></div><p className="mt-3 break-all text-caption text-text-secondary">Subject {event.subject_id}</p>{Object.keys(event.metadata).length > 0 && <pre className="mt-3 overflow-x-auto rounded-control bg-surface-secondary p-3 text-label">{JSON.stringify(event.metadata, null, 2)}</pre>}</Card>)}</div>}</PageContainer>
}
