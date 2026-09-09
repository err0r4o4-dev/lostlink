import { ArrowLeftRight, Filter, Image as ImageIcon, MapPin, PackageSearch, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { RouteCard } from '../components/route-card'
import { Badge, Button, Card, EmptyState, Input, IntegrationNotice, Notice, PageContainer, PageHeader, SearchField, Select, buttonVariants } from '../components/ui'
import { Localize } from '../i18n/language'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [searched, setSearched] = useState(searchParams.has('q'))

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearched(true)
    setSearchParams(query.trim() ? { q: query.trim() } : {})
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
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Select label="Report type" defaultValue="all"><option value="all">Lost and found</option><option value="lost">Lost only</option><option value="found">Found only</option></Select>
            <Input label="Category" placeholder="Any category" />
            <Input label="Approximate location" placeholder="Any campus area" />
            <Input label="Date" type="date" />
          </div>
        </Card>
      </form>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Filter aria-hidden="true" className="size-5 text-brand" /><h2 className="text-section font-semibold">Results</h2></div>
        <Badge>{searched ? '0 results' : 'Search not started'}</Badge>
      </div>
      <div className="mt-5">
        <EmptyState icon={PackageSearch} title={searched ? 'Search integration pending' : 'Start with an item description'} description={searched ? 'No report data was requested because a public search endpoint does not exist yet.' : 'Search by visible item details, category, date, or an approximate campus area.'} />
      </div>
      <div className="mt-5"><IntegrationNotice capability="Lost and found report search, filtering, and pagination" /></div>
    </PageContainer>
  )
}

export function ItemDetailPage() {
  const { itemId } = useParams()
  return (
    <PageContainer>
      <PageHeader eyebrow="Item details" title="Item information is unavailable" description="This route is ready for a public-safe item DTO, but no item endpoint or authorized image access contract currently exists." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.5fr)]">
        <Card className="overflow-hidden">
          <div className="flex min-h-80 items-center justify-center bg-surface-secondary"><ImageIcon aria-hidden="true" className="size-12 text-text-tertiary" /></div>
          <div className="p-5 md:p-7">
            <Badge>Reference {itemId ?? 'unavailable'}</Badge>
            <h2 className="mt-5 text-section font-semibold">No public item data loaded</h2>
            <p className="mt-2 text-caption text-text-secondary">Title, category, description, coarse location, date, and status will appear only when supplied by the Go API.</p>
          </div>
        </Card>
        <aside className="space-y-4">
          <Notice title="Private by design"><ShieldCheck aria-hidden="true" className="mr-1 inline size-4" />Reporter contact details, ownership answers, receipts, serial secrets, and staff notes are excluded from this surface.</Notice>
          <IntegrationNotice capability="Item details and authorized image access" />
          <Link className={buttonVariants({ variant: 'secondary' })} to="/search">Back to search</Link>
        </aside>
      </div>
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
