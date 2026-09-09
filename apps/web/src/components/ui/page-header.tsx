import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface PageHeaderProps {
  actions?: ReactNode
  description: string
  eyebrow?: string
  title: string
}

export function PageHeader({ actions, description, eyebrow, title }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <p className="text-caption font-semibold text-brand">{eyebrow}</p>}
        <h1 className="mt-1 text-page-mobile font-semibold tracking-tight text-text-primary md:text-page">{title}</h1>
        <p className="mt-3 text-body text-text-secondary-strong">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </header>
  )
}

export function PageContainer({ children, width = 'wide' }: { children: ReactNode; width?: 'wide' | 'form' }) {
  const mainRef = useRef<HTMLElement>(null)
  const location = useLocation()

  useEffect(() => {
    if (location.key !== 'default') {
      mainRef.current?.focus({ preventScroll: true })
    }
  }, [location.key])

  return (
    <main ref={mainRef} id="main-content" tabIndex={-1} className={`mobile-content-safe mx-auto px-5 py-8 focus:outline-none md:px-7 md:py-10 lg:px-8 xl:px-10 ${width === 'form' ? 'max-w-5xl' : 'max-w-content'}`}>
      {children}
    </main>
  )
}
