import { ArrowLeftRight, Filter, Image as ImageIcon, MapPin, PackageSearch, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { RouteCard } from '../components/route-card'
import { ItemCard } from '../components/item-card'
import { Badge, Button, Card, EmptyState, ErrorState, Input, IntegrationNotice, LoadingState, Notice, PageContainer, PageHeader, SearchField, Select, StatusBadge, buttonVariants } from '../components/ui'
import { Localize } from '../i18n/language'
import { getReport, searchReports } from '../features/reports/report-api'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')
  const [reportType, setReportType] = useState(searchParams.get('type') ?? 'all')
  const [searched, setSearched] = useState(searchParams.toString() !== '')
  const activeType = searchParams.get('type')
  const filteredType: 'lost' | 'found' | undefined = activeType === 'lost' || activeType === 'found' ? activeType : undefined
  const filters = { q: searchParams.get('q') ?? undefined, category: searchParams.get('category') ?? undefined, type: filteredType }
  const results = useQuery({ queryKey: ['reports', filters], queryFn: () => searchReports(filters), enabled: searched })

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearched(true)
    const next: Record<string, string> = {}
    if (query.trim()) next.q = query.trim()
    if (category.trim()) next.category = category.trim()
    if (reportType === 'lost' || reportType === 'found') next.type = reportType
    setSearchParams(next)
  }

  return (
    <PageContainer>
      <PageHeader eyebrow="Discovery" title="Search LostLink" description="Search is designed around public-safe item attributes. Private ownership evidence never belongs in discovery results." />
      <form onSubmit={submitSearch} className="space-y-4" role="search">
        <Card className="p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex-1"><SearchField label="Search lost and found reports" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Item, category, or campus area" /></div>
            <Button type="submit"><Search aria-hidden="true" className="size-4" />Search</Button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Select label="Report type" value={reportType} onChange={(event) => setReportType(event.target.value)}><option value="all">Lost and found</option><option value="lost">Lost only</option><option value="found">Found only</option></Select>
            <Input label="Category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Any category" />
          </div>
        </Card>
      </form>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Filter aria-hidden="true" className="size-5 text-brand" /><h2 className="text-section font-semibold">Results</h2></div>
        <Badge>{results.data ? `${results.data.reports.length} results` : searched ? 'Searching' : 'Search not started'}</Badge>
      </div>
      <div className="mt-5">
        {!searched && <EmptyState icon={PackageSearch} title="Start with an item description" description="Search by visible item details, category, or an approximate campus area." />}
        {results.isLoading && <LoadingState label="Searching public reports" />}
        {results.isError && <ErrorState description="Public reports could not be loaded." onRetry={() => void results.refetch()} />}
        {results.data?.reports.length === 0 && <EmptyState icon={PackageSearch} title="No reports found" description="Try a broader public-safe description or a different category." />}
        {results.data && results.data.reports.length > 0 && <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{results.data.reports.map((report) => <ItemCard key={report.id} item={{ id: report.id, reportType: report.report_type, title: report.item_name, category: report.category, location: report.approximate_location, dateLabel: report.event_date }} />)}</div>}
      </div>
    </PageContainer>
  )
}

export function ItemDetailPage() {
  const { itemId } = useParams()
  const result = useQuery({ queryKey: ['report', itemId], queryFn: () => getReport(itemId ?? ''), enabled: Boolean(itemId) })
  return (
    <PageContainer>
      <PageHeader eyebrow="Item details" title={result.data?.report.item_name ?? 'Public report'} description="Only public-safe report attributes are shown. Private evidence and reporter identity are excluded." />
      {result.isLoading && <LoadingState label="Loading report" />}
      {result.isError && <ErrorState title="Report unavailable" description="This report does not exist, was withdrawn, or could not be loaded." onRetry={() => void result.refetch()} />}
      {result.data && <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.5fr)]">
        <Card className="overflow-hidden">
          <div className="flex min-h-80 items-center justify-center bg-surface-secondary"><ImageIcon aria-hidden="true" className="size-12 text-text-tertiary" /></div>
          <div className="p-5 md:p-7">
            <div className="flex flex-wrap gap-2"><StatusBadge tone={result.data.report.report_type === 'lost' ? 'brand' : 'info'}>{result.data.report.report_type}</StatusBadge><Badge>{result.data.report.category}</Badge></div>
            <h2 className="mt-5 text-section font-semibold">{result.data.report.item_name}</h2>
            <p className="mt-2 whitespace-pre-wrap text-caption text-text-secondary">{result.data.report.public_description}</p>
            <dl className="mt-5 grid gap-4 text-caption sm:grid-cols-2"><div><dt className="font-semibold text-text-secondary">Date</dt><dd className="mt-1">{result.data.report.event_date}{result.data.report.approximate_time ? ` · ${result.data.report.approximate_time}` : ''}</dd></div><div><dt className="font-semibold text-text-secondary">Approximate location</dt><dd className="mt-1">{result.data.report.approximate_location}</dd></div></dl>
          </div>
        </Card>
        <aside className="space-y-4">
          <Notice title="Private by design"><ShieldCheck aria-hidden="true" className="mr-1 inline size-4" />Reporter contact details, ownership answers, receipts, serial secrets, and staff notes are excluded from this surface.</Notice>
          <IntegrationNotice capability="Authorized report image access" />
          <Link className={buttonVariants({ variant: 'secondary' })} to="/search">Back to search</Link>
        </aside>
      </div>}
    </PageContainer>
  )
}

export function MatchesPage() {
  return (
    <PageContainer>
      <PageHeader eyebrow="AI-assisted discovery" title="Potential matches" description="Similarity can rank candidates for review. It cannot verify ownership or approve a claim." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <EmptyState icon={Sparkles} title="No match candidates available" description="A lost report and a public matching endpoint are required before ranked candidates can appear." />
        <div className="space-y-4"><Notice title="How scores are used" tone="warning">A match score expresses similarity, not certainty. Each candidate still requires separate ownership verification and human review.</Notice><IntegrationNotice capability="Candidate retrieval, ranking, and safe explanations" /></div>
      </div>
    </PageContainer>
  )
}

function ComparisonPanel({ title }: { title: string }) {
  return (
    <Localize><Card className="p-5 md:p-6">
      <span className="flex size-11 items-center justify-center rounded-control bg-surface-secondary text-text-secondary"><ImageIcon aria-hidden="true" className="size-5" /></span>
      <h2 className="mt-5 text-card font-semibold">{title}</h2>
      <p className="mt-2 text-caption text-text-secondary">No report attributes are available from the API.</p>
      <dl className="mt-5 space-y-3 text-caption"><div className="flex justify-between gap-4"><dt className="text-text-secondary">Category</dt><dd>Unavailable</dd></div><div className="flex justify-between gap-4"><dt className="text-text-secondary">Date proximity</dt><dd>Unavailable</dd></div><div className="flex justify-between gap-4"><dt className="text-text-secondary">Location proximity</dt><dd>Unavailable</dd></div></dl>
    </Card></Localize>
  )
}

export function MatchDetailPage() {
  const { matchId } = useParams()
  return (
    <PageContainer>
      <PageHeader eyebrow="Potential match comparison" title="Review available attributes" description="Compare only public-safe report data. Missing attributes stay unavailable rather than being inferred." />
      <div className="mb-5 flex items-center gap-2 text-caption text-text-secondary"><MapPin aria-hidden="true" className="size-4" />Match reference: {matchId ?? 'unavailable'}</div>
      <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]"><ComparisonPanel title="Reported lost item" /><span className="mx-auto flex size-11 items-center justify-center self-center rounded-control bg-brand text-on-brand"><ArrowLeftRight aria-hidden="true" className="size-5" /></span><ComparisonPanel title="Potential found item" /></div>
      <div className="mt-5 grid gap-5 md:grid-cols-2"><IntegrationNotice capability="Match comparison data" /><Notice title="Ownership remains separate" tone="warning">This comparison cannot establish ownership. A protected claim and staff review flow is required.</Notice></div>
    </PageContainer>
  )
}

export function DiscoveryHubPage() {
  return <PageContainer><PageHeader eyebrow="Find what matters" title="Discovery tools" description="Move from public-safe search to potential-match review without crossing the ownership boundary." /><div className="grid gap-5 md:grid-cols-2"><RouteCard to="/search" icon={Search} title="Search reports" description="Filter public-safe lost and found reports when the API becomes available." /><RouteCard to="/matches" icon={Sparkles} title="Potential matches" description="Review ranked candidates as discovery assistance, never proof of ownership." /></div></PageContainer>
}
