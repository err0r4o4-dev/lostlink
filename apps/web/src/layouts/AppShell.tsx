import { Compass, Home, ShieldCheck } from 'lucide-react'
import { Outlet } from 'react-router-dom'

import { BrandMark } from '../components/brand-mark'
import { Badge, GlassSurface } from '../components/ui'

const navigation = [
  { href: '#home', icon: Home, label: 'Home' },
  { href: '#find', icon: Compass, label: 'Find' },
  { href: '#principles', icon: ShieldCheck, label: 'Safety' },
]

function NavigationLinks({ compact = false }: { compact?: boolean }) {
  return navigation.map(({ href, icon: Icon, label }) => (
    <a
      key={href}
      href={href}
      className={
        compact
          ? 'ui-transition flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-control px-2 text-label font-semibold text-text-secondary hover:bg-brand-soft hover:text-brand'
          : 'ui-transition flex min-h-11 items-center gap-3 rounded-control px-4 text-caption font-semibold text-text-secondary hover:bg-brand-soft hover:text-brand'
      }
    >
      <Icon aria-hidden="true" className={compact ? 'size-5' : 'size-5'} strokeWidth={2} />
      <span>{label}</span>
    </a>
  ))
}

export function AppShell() {
  return (
    <div className="app-backdrop min-h-screen">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-toast -translate-y-24 rounded-control bg-brand px-4 py-3 font-semibold text-on-brand focus-visible:translate-y-0"
      >
        Skip to content
      </a>

      <div className="app-shell-grid min-h-screen lg:grid">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-surface/90 px-6 py-8 lg:flex">
          <BrandMark />
          <nav aria-label="Primary" className="mt-12 grid gap-2">
            <NavigationLinks />
          </nav>
          <div className="mt-auto rounded-card bg-surface-secondary p-5">
            <Badge variant="brand">Foundation preview</Badge>
            <p className="mt-3 text-caption text-text-secondary">
              Product workflows stay unavailable until their scoped implementation tasks begin.
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          <GlassSurface className="safe-area-top sticky top-0 z-navigation rounded-none border-x-0 border-t-0">
            <header className="mx-auto flex h-(--layout-topbar) max-w-content items-center justify-between px-5 md:px-7 lg:px-8 xl:px-10">
              <div className="lg:hidden">
                <BrandMark compact />
              </div>
              <p className="hidden text-caption font-medium text-text-secondary lg:block">University lost &amp; found</p>
              <nav aria-label="Primary" className="hidden items-center gap-1 md:flex lg:hidden">
                <NavigationLinks />
              </nav>
              <Badge className="md:hidden">Preview</Badge>
              <Badge className="hidden lg:inline-flex">Web foundation</Badge>
            </header>
          </GlassSurface>
          <Outlet />
        </div>
      </div>

      <GlassSurface className="safe-area-bottom fixed inset-x-3 bottom-2 z-navigation rounded-feature shadow-floating md:hidden">
        <nav aria-label="Mobile primary" className="flex min-h-(--layout-mobile-nav) items-center px-2">
          <NavigationLinks compact />
        </nav>
      </GlassSurface>
    </div>
  )
}
