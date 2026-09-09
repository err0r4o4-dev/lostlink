import {
  Bell,
  CircleHelp,
  Clock3,
  Home,
  MapPin,
  PackagePlus,
  Search,
  Sparkles,
  UserRound,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'

import { BrandMark } from '../components/brand-mark'
import { Badge, GlassSurface } from '../components/ui'
import { Localize, useLanguage } from '../i18n/language'

interface NavigationItem {
  icon: LucideIcon
  label: string
  to: string
}

const desktopNavigation: NavigationItem[] = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/report', icon: PackagePlus, label: 'Report' },
  { to: '/matches', icon: Sparkles, label: 'Matches' },
  { to: '/tracking', icon: Clock3, label: 'Tracking' },
  { to: '/locations', icon: MapPin, label: 'Locations' },
  { to: '/help', icon: CircleHelp, label: 'Help' },
  { to: '/staff', icon: UsersRound, label: 'Staff preview' },
]

const tabletNavigation = desktopNavigation.slice(0, 4)
const mobileNavigation: NavigationItem[] = [
  desktopNavigation[0],
  desktopNavigation[1],
  desktopNavigation[2],
  desktopNavigation[4],
  { to: '/profile', icon: UserRound, label: 'Profile' },
]

function NavigationLinks({ compact = false, items = desktopNavigation }: { compact?: boolean; items?: NavigationItem[] }) {
  return <Localize>{items.map(({ to, icon: Icon, label }) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `${compact
          ? 'ui-transition flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-control px-2 text-label font-semibold'
          : 'ui-transition flex min-h-11 items-center gap-3 rounded-control px-4 text-caption font-semibold'} ${isActive ? 'bg-brand-soft text-brand' : 'text-text-secondary hover:bg-brand-soft hover:text-brand'}`
      }
    >
      <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
      <span>{label}</span>
    </NavLink>
  ))}</Localize>
}

function HeaderAction({ icon: Icon, label, to }: NavigationItem) {
  return <Localize><Link to={to} aria-label={label} className="ui-transition flex size-11 items-center justify-center rounded-control text-text-secondary hover:bg-brand-soft hover:text-brand"><Icon aria-hidden="true" className="size-5" /></Link></Localize>
}

function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage()
  const label = language === 'en' ? 'เปลี่ยนภาษาเป็นไทย' : 'Switch language to English'

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={label}
      title={label}
      className="ui-transition flex min-h-11 items-center justify-center gap-1 rounded-control p-1 text-text-secondary hover:bg-brand-soft hover:text-brand"
    >
      {(['th', 'en'] as const).map((option) => (
        <span
          key={option}
          aria-hidden="true"
          className={`ui-transition flex min-h-8 min-w-8 items-center justify-center rounded-small px-2 text-label font-bold ${language === option ? 'bg-brand text-on-brand' : 'bg-brand-soft text-brand'}`}
        >
          {option.toUpperCase()}
        </span>
      ))}
    </button>
  )
}

export function AppShell() {
  return (
    <Localize><div className="app-backdrop min-h-screen">
      <a href="#main-content" className="fixed left-4 top-4 z-toast -translate-y-24 rounded-control bg-brand px-4 py-3 font-semibold text-on-brand focus-visible:translate-y-0">Skip to content</a>
      <div className="app-shell-grid min-h-screen lg:grid">
        <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto border-r border-border bg-surface/90 px-6 py-6 lg:flex">
          <BrandMark />
          <nav aria-label="Primary" className="mt-8 grid gap-1"><NavigationLinks /></nav>
        </aside>
        <div className="min-w-0">
          <GlassSurface className="safe-area-top sticky top-0 z-navigation rounded-none border-x-0 border-t-0">
            <header className="mx-auto flex h-(--layout-topbar) max-w-content items-center justify-between px-5 md:px-7 lg:px-8 xl:px-10">
              <div className="lg:hidden"><BrandMark compact /></div>
              <p className="hidden text-caption font-medium text-text-secondary lg:block">University lost &amp; found</p>
              <nav aria-label="Primary" className="hidden items-center gap-1 md:flex lg:hidden"><NavigationLinks compact items={tabletNavigation} /></nav>
              <div className="flex items-center gap-1">
                <div className="hidden items-center gap-1 md:flex"><LanguageToggle /><HeaderAction to="/notifications" icon={Bell} label="Notifications" /><HeaderAction to="/profile" icon={UserRound} label="Profile" /></div>
                <div className="flex items-center gap-1 md:hidden"><LanguageToggle /><Badge>Preview</Badge></div>
              </div>
            </header>
          </GlassSurface>
          <Outlet />
        </div>
      </div>
      <GlassSurface className="safe-area-bottom fixed inset-x-3 bottom-2 z-navigation rounded-feature shadow-floating md:hidden">
        <nav aria-label="Mobile primary" className="flex min-h-(--layout-mobile-nav) items-center px-2"><NavigationLinks compact items={mobileNavigation} /></nav>
      </GlassSurface>
    </div></Localize>
  )
}
