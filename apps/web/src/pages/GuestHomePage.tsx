import {
  ArrowRight,
  Backpack,
  CupSoda,
  IdCard,
  KeyRound,
  LockKeyhole,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { buttonVariants } from '../components/ui'
import { Localize } from '../i18n/language'

const steps = [
  {
    number: '01',
    title: 'Report item details',
    description: 'Enter details about the lost or found item, such as its category, color, appearance, and relevant time period.',
  },
  {
    number: '02',
    title: 'Find potentially matching items',
    description: 'The system compares information and ranks items with similar details to make discovery easier.',
  },
  {
    number: '03',
    title: 'Verify and collect',
    description: 'When a potentially related item is found, the system guides you through ownership verification before return.',
  },
]

const trustItems = [
  {
    icon: LockKeyhole,
    title: 'Personal information has limited exposure',
    description: 'Names, contact details, and personal information are not shown publicly unless necessary.',
  },
  {
    icon: MapPin,
    title: 'Precise locations are not public',
    description: 'The system displays location information only at an appropriate level to reduce unnecessary exposure.',
  },
  {
    icon: ShieldCheck,
    title: 'Verification happens before return',
    description: 'Finding a similar item does not establish ownership. Users must complete verification before return.',
  },
]

function CampusLostItemVisual() {
  return (
    <Localize><div
      role="img"
      aria-label="Illustration of a backpack, identification card, and drink cup as example items that may be found on campus."
      className="relative mx-auto w-full max-w-xl px-3 py-6 md:px-8 md:py-10"
    >
      <div aria-hidden="true" className="absolute right-0 top-0 size-36 rounded-full bg-brand-soft opacity-80 blur-sm md:size-48" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 size-32 rounded-full bg-surface-secondary md:size-44" />

      <div className="relative rounded-overlay border border-border bg-surface p-4 shadow-floating md:p-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <span className="h-2 w-16 rounded-pill bg-brand/55" />
          <span className="size-3 rounded-pill bg-brand" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="flex min-h-28 items-center justify-center rounded-card bg-surface-secondary text-text-secondary md:min-h-36">
            <Backpack aria-hidden="true" className="size-14 md:size-16" strokeWidth={1.5} />
          </div>
          <div className="flex min-h-28 items-center justify-center rounded-card bg-surface-secondary text-brand/70 md:min-h-36">
            <IdCard aria-hidden="true" className="size-12 md:size-14" strokeWidth={1.5} />
          </div>
          <div className="flex min-h-28 items-center justify-center rounded-card bg-surface-secondary text-text-secondary md:min-h-36">
            <CupSoda aria-hidden="true" className="size-11 md:size-13" strokeWidth={1.5} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand">
            <Backpack aria-hidden="true" className="size-5" />
          </span>
          <span className="h-2 flex-1 rounded-pill bg-surface-secondary" />
          <span className="h-2 w-1/4 rounded-pill bg-surface-secondary" />
        </div>

        <div className="mt-4 flex justify-end">
          <span className="inline-flex items-center gap-2 rounded-pill bg-brand-soft px-4 py-2 text-label font-semibold text-brand">
            <Search aria-hidden="true" className="size-4" />
            Search potentially related items
          </span>
        </div>
      </div>

      <span className="absolute bottom-2 left-0 flex size-12 items-center justify-center rounded-feature border border-border bg-surface text-brand shadow-card md:bottom-8 md:size-14">
        <KeyRound aria-hidden="true" className="size-6" />
      </span>
    </div></Localize>
  )
}

function StepCard({ number, title, description, wide = false }: (typeof steps)[number] & { wide?: boolean }) {
  return (
    <li className={`rounded-card border border-border bg-surface-secondary p-5 md:p-6 ${wide ? 'md:col-span-2 xl:col-span-1' : ''}`}>
      <p aria-hidden="true" className="text-page-mobile font-bold leading-none text-brand/20">{number}</p>
      <h3 className="mt-5 text-card font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-caption text-text-secondary">{description}</p>
    </li>
  )
}

export function GuestHomePage() {
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()

  useEffect(() => {
    if (location.key !== 'default') mainRef.current?.focus({ preventScroll: true })
  }, [location.key])

  return (
    <Localize><main ref={mainRef} id="main-content" tabIndex={-1} className="focus:outline-none">
      <section aria-labelledby="guest-home-title" className="relative overflow-hidden border-b border-border">
        <div aria-hidden="true" className="absolute -right-24 top-12 size-72 rounded-full bg-brand-soft/70 blur-3xl" />
        <div className="relative mx-auto grid w-full items-center gap-10 px-5 py-14 md:px-7 md:py-20 lg:w-[70%] lg:px-0 lg:py-24 xl:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="inline-flex rounded-pill bg-brand-soft px-4 py-2 text-label font-semibold text-brand">
              Lost &amp; Found for universities
            </p>
            <h1 id="guest-home-title" className="mt-6 max-w-3xl text-page-mobile font-bold tracking-tight text-balance text-text-primary md:text-page">
              Lost items<br />may be waiting for you to find them
            </h1>
            <p className="mt-5 max-w-2xl text-body text-text-secondary-strong md:text-lead">
              LostLink connects people who lost items with people who found them on campus, making discovery, verification, and return easier and safer.
            </p>
            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link to="/register" className={`${buttonVariants({ variant: 'primary' })} min-h-12 sm:min-w-44`}>
                Get started
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-text-secondary">
              <span>Easy to use</span><span aria-hidden="true">·</span>
              <span>Respects privacy</span><span aria-hidden="true">·</span>
              <span>Verification before return</span>
            </p>
          </div>

          <CampusLostItemVisual />
        </div>
      </section>

      <section aria-labelledby="how-it-works-title" className="bg-surface py-16 md:py-20 lg:py-24">
        <div className="mx-auto w-full px-5 md:px-7 lg:w-[70%] lg:px-0">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-caption font-semibold text-brand">How it works</p>
            <h2 id="how-it-works-title" className="mt-2 text-page-mobile font-bold tracking-tight text-text-primary md:text-page">
              Find lost items more easily in 3 steps
            </h2>
            <p className="mt-3 text-body text-text-secondary">
              LostLink reduces time spent searching manually and brings potentially related items forward for review.
            </p>
          </div>

          <ol className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {steps.map((step, index) => <StepCard key={step.number} {...step} wide={index === 2} />)}
          </ol>

          <div className="mt-5 flex items-start gap-3 rounded-card border border-brand/10 bg-brand-soft/70 px-4 py-4 text-caption text-brand md:items-center md:px-5">
            <Sparkles aria-hidden="true" className="mt-0.5 size-5 shrink-0 md:mt-0" />
            <p>
              <strong className="font-semibold">AI only assists with discovery and similarity ranking.</strong>{' '}
              A potential match is not proof of ownership.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="privacy-title" className="py-16 md:py-20 lg:py-24">
        <div className="mx-auto w-full px-5 md:px-7 lg:w-[70%] lg:px-0">
          <div className="rounded-overlay border border-border bg-surface p-6 shadow-card md:p-10">
            <p className="text-caption font-semibold text-brand">Privacy by design</p>
            <h2 id="privacy-title" className="mt-2 max-w-4xl text-page-mobile font-bold tracking-tight text-text-primary md:text-page">
              Find lost items without revealing more than necessary
            </h2>
            <p className="mt-3 max-w-3xl text-body text-text-secondary">
              LostLink separates discovery information from personal data that does not need to be public.
            </p>

            <div className="mt-9 grid gap-7 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
              {trustItems.map(({ icon: Icon, title, description }) => (
                <article key={title} className="flex gap-4 md:block">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-feature bg-brand-soft text-brand">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <div className="md:mt-5">
                    <h3 className="text-card font-semibold text-text-primary">{title}</h3>
                    <p className="mt-2 text-caption text-text-secondary">{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

    </main></Localize>
  )
}
