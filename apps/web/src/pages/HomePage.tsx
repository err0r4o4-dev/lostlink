import {
  ArrowRight,
  Bell,
  Box,
  HeartHandshake,
  MapPin,
  PackageSearch,
  SearchCheck,
  ShieldCheck,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'

import { Badge, Card, EmptyState, SearchField, buttonVariants } from '../components/ui'

const principles = [
  {
    icon: SearchCheck,
    title: 'Similarity assists discovery',
    detail: 'Image and text signals may rank possible matches without deciding who owns an item.',
  },
  {
    icon: ShieldCheck,
    title: 'Verification stays private',
    detail: 'Ownership evidence belongs to a separate protected flow and is never shown as public match data.',
  },
  {
    icon: HeartHandshake,
    title: 'Humans make the decision',
    detail: 'Staff review and accountable pickup remain explicit steps before an item is returned.',
  },
]

const plannedEntries = [
  {
    icon: Bell,
    title: 'Track a report',
    detail: 'Status and notification tools will appear here after their product workflow is implemented.',
  },
  {
    icon: MapPin,
    title: 'Explore campus areas',
    detail: 'Location discovery will remain privacy-conscious and use only approved report information.',
  },
]

export function HomePage() {
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()

  useEffect(() => {
    if (location.key !== 'default') {
      mainRef.current?.focus({ preventScroll: true })
    }
  }, [location.key])

  return (
    <main
      ref={mainRef}
      id="main-content"
      tabIndex={-1}
      className="mobile-content-safe mx-auto max-w-content px-5 py-10 focus:outline-none md:px-7 md:py-12 lg:px-8 xl:px-10 xl:py-16"
    >
      <section id="home" aria-labelledby="home-title" className="grid items-stretch gap-6 xl:grid-cols-5 xl:gap-8">
        <div className="flex flex-col justify-center xl:col-span-3">
          <Badge variant="brand" className="mb-5 w-fit">
            LostLink frontend
          </Badge>
          <h1 id="home-title" className="max-w-3xl text-page-mobile font-semibold tracking-tight text-balance text-text-primary md:text-page xl:text-display">
            Lost items deserve a clear path home.
          </h1>
          <p className="mt-5 max-w-2xl text-body text-text-secondary-strong md:text-lead">
            LostLink is being built for university communities, with clear stages for discovery, verification,
            staff review, and return.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/report/lost" className={buttonVariants({ variant: 'primary' })}>
              Report a lost item
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link to="/report/found" className={buttonVariants({ variant: 'secondary' })}>
              Report a found item
            </Link>
          </div>
          <p className="mt-3 text-caption text-text-secondary-strong">Build a complete frontend draft, then review the pending server integration.</p>
        </div>

        <Card elevated className="relative overflow-hidden p-6 md:p-8 xl:col-span-2">
          <div aria-hidden="true" className="absolute -right-8 -top-8 size-40 rounded-full bg-brand-soft blur-3xl" />
          <div className="relative flex h-full min-h-72 flex-col justify-between">
            <span className="flex size-14 items-center justify-center rounded-feature bg-brand text-on-brand shadow-card">
              <PackageSearch aria-hidden="true" className="size-7" strokeWidth={2} />
            </span>
            <div className="mt-12">
              <p className="text-caption font-semibold uppercase tracking-label text-brand">Campus-centered</p>
              <h2 className="mt-3 text-section font-semibold tracking-tight text-text-primary">Find what matters, thoughtfully.</h2>
              <p className="mt-3 text-caption text-text-secondary">
                Discovery can be intelligent while ownership decisions stay careful, private, and human.
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section id="find" aria-labelledby="find-title" className="mt-12 scroll-mt-28 md:mt-16">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-caption font-semibold text-brand">Start here</p>
            <h2 id="find-title" className="mt-1 text-section font-semibold tracking-tight text-text-primary">
              Search and report
            </h2>
          </div>
          <Badge>Frontend ready</Badge>
        </div>

        <Card className="p-5 md:p-6">
          <SearchField label="Search LostLink" placeholder="Search by item, category, or campus area" readOnly />
          <p className="mt-3 text-caption text-text-secondary">
            Open the complete search interface to filter public-safe report attributes.
          </p>
          <Link to="/search" className={`${buttonVariants({ variant: 'secondary' })} mt-4`}>Open search</Link>
        </Card>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Card className="group p-5 md:p-6">
            <span className="flex size-12 items-center justify-center rounded-control bg-brand-soft text-brand">
              <PackageSearch aria-hidden="true" className="size-6" />
            </span>
            <h3 className="mt-6 text-card font-semibold text-text-primary">Report something lost</h3>
            <p className="mt-2 text-caption text-text-secondary">
              A guided report will collect only the details needed to help discovery.
            </p>
            <Link to="/report/lost" className={`${buttonVariants({ variant: 'ghost' })} mt-5 px-0`}>Create lost report</Link>
          </Card>

          <Card className="group p-5 md:p-6">
            <span className="flex size-12 items-center justify-center rounded-control bg-surface-secondary text-text-primary">
              <Box aria-hidden="true" className="size-6" />
            </span>
            <h3 className="mt-6 text-card font-semibold text-text-primary">Report something found</h3>
            <p className="mt-2 text-caption text-text-secondary">
              Found-item details will support safe matching without exposing private evidence.
            </p>
            <Link to="/report/found" className={`${buttonVariants({ variant: 'ghost' })} mt-5 px-0`}>Create found report</Link>
          </Card>
        </div>
      </section>

      <section aria-labelledby="recent-title" className="mt-12 md:mt-16">
        <div className="mb-5">
          <p className="text-caption font-semibold text-brand">Discovery</p>
          <h2 id="recent-title" className="mt-1 text-section font-semibold tracking-tight text-text-primary">
            Recent found items
          </h2>
        </div>
        <EmptyState
          icon={Box}
          title="No public items yet"
          description="Recent found items will appear here only after the reporting workflow and its privacy controls are implemented."
        />
      </section>

      <section aria-labelledby="planned-title" className="mt-12 md:mt-16">
        <div className="mb-5">
          <p className="text-caption font-semibold text-brand">Next steps</p>
          <h2 id="planned-title" className="mt-1 text-section font-semibold tracking-tight text-text-primary">
            Matching and tracking entry points
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {plannedEntries.map(({ icon: Icon, title, detail }) => (
            <Card key={title} className="flex gap-4 p-5 md:p-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h3 className="text-card font-semibold text-text-primary">{title}</h3>
                <p className="mt-2 text-caption text-text-secondary">{detail}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section id="principles" aria-labelledby="principles-title" className="mt-12 scroll-mt-28 md:mt-16">
        <div className="mb-5 max-w-2xl">
          <p className="text-caption font-semibold text-brand">Built on trust</p>
          <h2 id="principles-title" className="mt-1 text-section font-semibold tracking-tight text-text-primary">
            Helpful technology, accountable decisions
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {principles.map(({ icon: Icon, title, detail }) => (
            <Card className="p-5 md:p-6" key={title}>
              <Icon aria-hidden="true" className="mb-5 size-7 text-brand" strokeWidth={2} />
              <h3 className="text-card font-semibold text-text-primary">{title}</h3>
              <p className="mt-2 text-caption text-text-secondary">{detail}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
