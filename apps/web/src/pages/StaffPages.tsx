import { Activity, ClipboardList, FileSearch, Scale, ShieldAlert, Sparkles, UsersRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { RouteCard } from '../components/route-card'
import { Badge, Card, EmptyState, ErrorState, IntegrationNotice, LoadingState, Notice, PageContainer, PageHeader, StatusBadge, buttonVariants } from '../components/ui'
import { useApiHealth } from '../features/system/use-api-health'

function StaffBoundaryNotice() {
  return <Notice title="Staff API pending" tone="warning"><ShieldAlert aria-hidden="true" className="mr-1 inline size-4" />This route requires a server-issued staff or admin role. Queue data and staff actions remain unavailable until their authorized APIs and audit records are implemented.</Notice>
}

export function StaffDashboardPage() {
  const health = useApiHealth()
  return (
    <PageContainer>
      <PageHeader eyebrow="Staff workspace" title="Operations dashboard" description="A desktop-first overview for authorized review queues, with server-enforced access still required." />
      <StaffBoundaryNotice />
      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[['Open reports', 'Unavailable'], ['Potential matches', 'Unavailable'], ['Claims to review', 'Unavailable'], ['Returns in progress', 'Unavailable']].map(([label, value]) => <Card className="p-5" key={label}><p className="text-caption text-text-secondary">{label}</p><p className="mt-2 text-section font-semibold">{value}</p></Card>)}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-5 md:grid-cols-3"><RouteCard to="/staff/reports" icon={ClipboardList} title="Report queue" description="Review lost and found reports when authorized report APIs exist." /><RouteCard to="/staff/matches" icon={Sparkles} title="Matching review" description="Inspect safe similarity output without treating a score as ownership proof." /><RouteCard to="/staff/claims" icon={Scale} title="Claim review" description="Handle restricted ownership evidence through an authorized workflow." /></div>
        <Card className="p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Activity aria-hidden="true" className="size-5 text-brand" /><h2 className="text-card font-semibold">Public API</h2></div>{health.isSuccess && <StatusBadge tone={health.data.status === 'ok' ? 'success' : 'warning'}>{health.data.status}</StatusBadge>}</div><div className="mt-5">{health.isPending ? <LoadingState label="Checking API health" /> : health.isError ? <ErrorState title="API unavailable" description="The public health endpoint could not be reached." onRetry={() => void health.refetch()} /> : <p className="text-caption text-text-secondary">Connected to the real Go health endpoint. Product endpoints remain unavailable.</p>}</div></Card>
      </div>
    </PageContainer>
  )
}

interface QueuePageProps {
  description: string
  icon: LucideIcon
  title: string
  columns: string[]
  capability: string
}

function QueuePage({ capability, columns, description, icon: Icon, title }: QueuePageProps) {
  return (
    <PageContainer>
      <PageHeader eyebrow="Staff workspace" title={title} description={description} actions={<Link to="/staff" className={buttonVariants({ variant: 'secondary' })}>Dashboard</Link>} />
      <StaffBoundaryNotice />
      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5"><div className="flex items-center gap-3"><Icon aria-hidden="true" className="size-5 text-brand" /><h2 className="text-card font-semibold">Queue</h2></div><Badge>0 records</Badge></div>
        <div className="overflow-x-auto"><table className="w-full min-w-3xl text-left text-caption"><thead className="bg-surface-secondary text-text-secondary"><tr>{columns.map((column) => <th className="px-5 py-4 font-semibold" scope="col" key={column}>{column}</th>)}</tr></thead><tbody><tr><td colSpan={columns.length} className="p-5"><EmptyState icon={Icon} title="No queue data available" description="No records were requested because the required authenticated staff endpoint does not exist." /></td></tr></tbody></table></div>
      </Card>
      <div className="mt-5"><IntegrationNotice capability={capability} /></div>
    </PageContainer>
  )
}

export function StaffReportsPage() { return <QueuePage title="Report queue" description="Review report type, lifecycle state, public-safe details, and moderation needs." icon={FileSearch} columns={['Reference', 'Type', 'Item', 'Submitted', 'Status', 'Action']} capability="Authorized report queue, filters, pagination, and moderation" /> }
export function StaffMatchesPage() { return <QueuePage title="Matching review" description="Review ranked candidates, model metadata, and safe explanations without crossing the ownership boundary." icon={Sparkles} columns={['Reference', 'Lost report', 'Found report', 'Match score', 'Model version', 'Action']} capability="Authorized matching review and model metadata" /> }
export function StaffClaimsPage() { return <QueuePage title="Claim review" description="Restricted evidence and decisions require explicit RBAC, audit records, and workflow transitions." icon={UsersRound} columns={['Reference', 'Claimant', 'Item', 'Submitted', 'Status', 'Action']} capability="Authorized claim queue, restricted evidence, decisions, and audit trail" /> }
