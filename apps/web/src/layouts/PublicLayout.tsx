import { Link, Outlet } from 'react-router-dom'

import { buttonVariants } from '../components/ui'
import { Localize } from '../i18n/language'
import { LanguageToggle } from './AppShell'

function PublicBrand() {
  return (
    <Localize><Link
      to="/"
      aria-label="LostLink home"
      className="group inline-flex min-h-11 items-center gap-2.5 rounded-control font-bold tracking-tight text-text-primary"
    >
      <span className="ui-transition flex size-8 items-center justify-center rounded-small bg-brand text-caption font-bold text-on-brand shadow-card group-hover:bg-brand-hover md:size-9">
        L
      </span>
      <span className="text-body">LostLink</span>
    </Link></Localize>
  )
}

export function PublicLayout() {
  return (
    <Localize><div className="min-h-screen bg-canvas text-text-primary">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-toast -translate-y-24 rounded-control bg-brand px-4 py-3 font-semibold text-on-brand focus-visible:translate-y-0"
      >
        Skip to content
      </a>

      <header className="safe-area-top sticky top-0 z-navigation border-b border-border bg-surface">
        <div className="mx-auto flex min-h-18 w-full items-center justify-between gap-3 px-5 md:px-7 lg:w-[70%] lg:px-0">
          <PublicBrand />
          <nav className="flex items-center gap-2 md:gap-3" aria-label="Authentication">
            <LanguageToggle />
            <Link to="/login" className={buttonVariants({ variant: 'primary', size: 'compact' })}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <Outlet />

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid w-full gap-8 px-5 py-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:px-7 lg:w-[70%] lg:px-0">
          <div>
            <PublicBrand />
            <p className="mt-3 max-w-xl text-caption text-text-secondary">
              A university Lost &amp; Found platform connecting people who lost items with people who found them.
            </p>
          </div>
          <div className="md:text-right">
            <nav aria-label="Website information" className="flex flex-wrap gap-x-5 gap-y-3 text-caption font-medium text-text-secondary md:justify-end">
              <Link className="ui-transition hover:text-brand" to="/privacy">Privacy</Link>
              <Link className="ui-transition hover:text-brand" to="/terms">Terms of use</Link>
              <Link className="ui-transition hover:text-brand" to="/help">Help</Link>
            </nav>
            <p className="mt-4 text-label text-text-secondary">© 2026 LostLink</p>
          </div>
        </div>
      </footer>
    </div></Localize>
  )
}
