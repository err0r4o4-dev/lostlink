import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { Localize } from '../../i18n/language'

interface PageHeaderProps {
  actions?: ReactNode
  description: string
  eyebrow?: string
  title: string
  visual?: ReactNode
}

export function PageHeader({ actions, description, eyebrow, title, visual }: PageHeaderProps) {
  return (
    <header className="page-intro relative mb-8 overflow-hidden rounded-feature border border-white/70 px-5 py-6 shadow-card md:mb-10 md:px-7 md:py-8">
      <span aria-hidden="true" className="absolute -right-10 -top-16 size-40 rounded-pill border-8 border-white/45" />
      <span aria-hidden="true" className="absolute bottom-5 right-36 size-3 rounded-pill bg-brand/15" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          {eyebrow && <p className="text-caption font-semibold text-brand">{eyebrow}</p>}
          <h1 className="mt-1 text-page-mobile font-bold tracking-tight text-text-primary md:text-page">{title}</h1>
          <p className="mt-3 text-body text-text-secondary-strong">{description}</p>
        </div>
        {visual && <div className="hidden shrink-0 lg:block">{visual}</div>}
        {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
      </div>
    </header>
  )
}

export function PageContainer({ children, className = '', width = 'wide' }: { children: ReactNode; className?: string; width?: 'wide' | 'form' }) {
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()

  useEffect(() => {
    if (location.key !== 'default') {
      mainRef.current?.focus({ preventScroll: true })
    }
  }, [location.key])

  return (
    <Localize>
      <main ref={mainRef} id="main-content" tabIndex={-1} className={`page-content mobile-content-safe relative isolate mx-auto px-5 py-8 focus:outline-none md:px-7 md:py-10 lg:px-8 xl:px-10 ${width === 'form' ? 'max-w-5xl' : 'max-w-content'} ${className}`}>
        {children}
      </main>
    </Localize>
  )
}
