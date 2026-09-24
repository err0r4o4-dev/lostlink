import { Filter, Image as ImageIcon, PackageSearch, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { RouteCard } from '../components/route-card'
import { ItemCard } from '../components/item-card'
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, Notice, PageContainer, PageHeader, SearchField, Select, StatusBadge, buttonVariants } from '../components/ui'
import { apiErrorMessage } from '../api/error'
import { useAuth } from '../features/auth/auth-state'
import { getMatch, listReportMatches, runMatching } from '../features/matching/matching-api'
import { getReport, listMyReports, listReportImages, reportImageUrl, searchReports } from '../features/reports/report-api'
import { showAlert } from '../lib/alert'

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
  const images = useQuery({ queryKey: ['reports', itemId, 'images'], queryFn: () => listReportImages(itemId ?? ''), enabled: Boolean(itemId) })
  return (
    <PageContainer>
      <PageHeader eyebrow="Item details" title={result.data?.report.item_name ?? 'Public report'} description="Only public-safe report attributes are shown. Private evidence and reporter identity are excluded." />
      {result.isLoading && <LoadingState label="Loading report" />}
      {result.isError && <ErrorState title="Report unavailable" description="This report does not exist, was withdrawn, or could not be loaded." onRetry={() => void result.refetch()} />}
      {result.data && <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.5fr)]">
        <Card className="overflow-hidden">
          <div className="flex min-h-80 items-center justify-center bg-surface-secondary">{images.data?.images[0] ? <img src={reportImageUrl(images.data.images[0].content_url)} alt="" className="max-h-[32rem] w-full object-contain" /> : <ImageIcon aria-hidden="true" className="size-12 text-text-tertiary" />}</div>
          <div className="p-5 md:p-7">
            <div className="flex flex-wrap gap-2"><StatusBadge tone={result.data.report.report_type === 'lost' ? 'brand' : 'info'}>{result.data.report.report_type}</StatusBadge><Badge>{result.data.report.category}</Badge></div>
            <h2 className="mt-5 text-section font-semibold">{result.data.report.item_name}</h2>
            <p className="mt-2 whitespace-pre-wrap text-caption text-text-secondary">{result.data.report.public_description}</p>
            <dl className="mt-5 grid gap-4 text-caption sm:grid-cols-2"><div><dt className="font-semibold text-text-secondary">Date</dt><dd className="mt-1">{result.data.report.event_date}{result.data.report.approximate_time ? ` · ${result.data.report.approximate_time}` : ''}</dd></div><div><dt className="font-semibold text-text-secondary">Approximate location</dt><dd className="mt-1">{result.data.report.approximate_location}</dd></div></dl>
          </div>
        </Card>
        <aside className="space-y-4">
          <Notice title="Private by design"><ShieldCheck aria-hidden="true" className="mr-1 inline size-4" />Reporter contact details, ownership answers, receipts, serial secrets, and staff notes are excluded from this surface.</Notice>
          {images.data && images.data.images.length > 1 && <Card className="grid grid-cols-2 gap-2 p-3">{images.data.images.slice(1).map((image) => <img key={image.id} src={reportImageUrl(image.content_url)} alt="" className="aspect-square w-full rounded-control object-cover" />)}</Card>}
          <Link className={buttonVariants({ variant: 'secondary' })} to="/search">Back to search</Link>
        </aside>
      </div>}
    </PageContainer>
  )
}

export function MatchesPage() {
  const { request } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const reportId = searchParams.get('report') ?? ''
  const reports = useQuery({ queryKey: ['reports', 'mine'], queryFn: () => listMyReports(request) })
  const matches = useQuery({ queryKey: ['matches', 'report', reportId], queryFn: () => listReportMatches(request, reportId), enabled: Boolean(reportId) })
  const matchingRun = useMutation({
    mutationFn: () => runMatching(request, reportId, crypto.randomUUID()),
    onSuccess: async (data) => {
      queryClient.setQueryData(['matches', 'report', reportId], { matches: data.matches })
      await showAlert.success('Matching completed', `${data.matches.length} potential matches are ready for review.`)
    },
  })
  const lostReports = reports.data?.reports.filter((report) => report.report_type === 'lost' && report.status === 'active') ?? []

  return (
    <PageContainer>
      <PageHeader eyebrow="AI-assisted discovery" title="Potential matches" description="Similarity can rank candidates for review. It cannot verify ownership or approve a claim." />
      <Card className="p-5 md:p-6">
        {reports.isPending ? <LoadingState label="Loading lost reports" /> : reports.isError ? <ErrorState title="Reports unavailable" description="Your lost reports could not be loaded." onRetry={() => void reports.refetch()} /> : <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Select label="Lost report" value={reportId} onChange={(event) => setSearchParams(event.target.value ? { report: event.target.value } : {})}><option value="">Choose a report</option>{lostReports.map((report) => <option key={report.id} value={report.id}>{report.item_name} · {report.approximate_location}</option>)}</Select></div><Button disabled={!reportId || matchingRun.isPending} onClick={() => matchingRun.mutate()}><Sparkles aria-hidden="true" className="size-4" />{matchingRun.isPending ? 'Matching…' : 'Run matching'}</Button></div>}
      </Card>
      {matchingRun.isError && <div className="mt-5"><Notice announce title="Matching failed" tone="error">{apiErrorMessage(matchingRun.error, 'Matching is temporarily unavailable.')}</Notice></div>}
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>{!reportId ? <EmptyState icon={Sparkles} title="Choose a lost report" description="Select an active lost report to load or generate ranked candidates." /> : matches.isPending ? <LoadingState label="Loading potential matches" /> : matches.isError ? <ErrorState title="Matches unavailable" description="Potential matches could not be loaded." onRetry={() => void matches.refetch()} /> : !matches.data.matches.length ? <EmptyState icon={Sparkles} title="No potential matches yet" description="Run matching to compare this lost report with eligible found reports." /> : <div className="grid gap-5 sm:grid-cols-2">{matches.data.matches.map((match) => <div key={match.id} className="space-y-3"><ItemCard item={{ id: match.candidate.id, reportType: match.candidate.report_type, title: match.candidate.item_name, category: match.candidate.category, location: match.candidate.approximate_location, dateLabel: match.candidate.event_date, matchScore: match.score * 100 }} /><Link to={`/matches/${encodeURIComponent(match.id)}`} className={buttonVariants({ variant: 'secondary', className: 'w-full' })}>Review match</Link></div>)}</div>}</div>
        <Notice title="How scores are used" tone="warning">A score estimates similarity only. Ownership requires private evidence and an authorized staff decision.</Notice>
      </div>
    </PageContainer>
  )
}

export function MatchDetailPage() {
  const { matchId } = useParams()
  const { request } = useAuth()
  const result = useQuery({ queryKey: ['match', matchId], queryFn: () => getMatch(request, matchId ?? ''), enabled: Boolean(matchId) })
  return (
    <PageContainer>
      <PageHeader eyebrow="Potential match comparison" title={result.data?.match.candidate.item_name ?? 'Review potential match'} description="Review public-safe candidate data and similarity signals before deciding whether to start a private claim." />
      {result.isPending && <LoadingState label="Loading match" />}
      {result.isError && <ErrorState title="Match unavailable" description="This match is unavailable or you are not authorized to view it." onRetry={() => void result.refetch()} />}
      {result.data && <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]"><Card className="p-5 md:p-7"><div className="flex flex-wrap gap-2"><StatusBadge tone="warning">{Math.round(result.data.match.score * 100)}% similar</StatusBadge><StatusBadge>{result.data.match.review_status}</StatusBadge></div><h2 className="mt-5 text-section font-semibold">{result.data.match.candidate.item_name}</h2><p className="mt-2 text-caption text-text-secondary">{result.data.match.candidate.public_description}</p><dl className="mt-6 grid gap-4 text-caption sm:grid-cols-2"><div><dt className="font-semibold text-text-secondary">Category</dt><dd className="mt-1">{result.data.match.candidate.category}</dd></div><div><dt className="font-semibold text-text-secondary">Approximate location</dt><dd className="mt-1">{result.data.match.candidate.approximate_location}</dd></div><div><dt className="font-semibold text-text-secondary">Event date</dt><dd className="mt-1">{result.data.match.candidate.event_date}</dd></div><div><dt className="font-semibold text-text-secondary">Source report</dt><dd className="mt-1 break-all">{result.data.match.source_report_id}</dd></div></dl><div className="mt-6"><p className="text-caption font-semibold text-text-secondary">Similarity signals</p><div className="mt-2 flex flex-wrap gap-2">{result.data.match.signals.map((signal) => <Badge key={signal}>{signal}</Badge>)}</div></div></Card><aside className="space-y-4"><Notice title="Ownership remains separate" tone="warning">This comparison cannot establish ownership. Private evidence and staff review are required.</Notice><Link to={`/claims/new?match=${encodeURIComponent(result.data.match.id)}`} className={buttonVariants({ variant: 'primary', className: 'w-full' })}>Start private claim</Link></aside></div>}
    </PageContainer>
  )
}

export function DiscoveryHubPage() {
  return <PageContainer><PageHeader eyebrow="Find what matters" title="Discovery tools" description="Move from public-safe search to potential-match review without crossing the ownership boundary." /><div className="grid gap-5 md:grid-cols-2"><RouteCard to="/search" icon={Search} title="Search reports" description="Filter active public-safe lost and found reports." /><RouteCard to="/matches" icon={Sparkles} title="Potential matches" description="Run matching for your lost reports and review ranked candidates." /></div></PageContainer>
}
