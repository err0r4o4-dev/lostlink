import {
  Bell,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  FileCheck2,
  LayoutGrid,
  LogOut,
  MapPin,
  MessageSquare,
  PackagePlus,
  Search,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { BrandMark } from '../components/brand-mark'
import { GlassSurface } from '../components/ui'
import { useAuth } from '../features/auth/auth-state'
import { Localize, useLanguage } from '../i18n/language'
import { showAlert } from '../lib/alert'

interface NavigationItem {
  icon: LucideIcon
  label: string
  to: string
}

const desktopNavigation: NavigationItem[] = [
  { to: '/discover', icon: Compass, label: 'Explore items' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { to: '/report', icon: PackagePlus, label: 'Report' },
  { to: '/matches', icon: Sparkles, label: 'Matches' },
  { to: '/claims', icon: FileCheck2, label: 'Claims' },
  { to: '/tracking', icon: Clock3, label: 'Tracking' },
  { to: '/locations', icon: MapPin, label: 'Locations' },
  { to: '/help', icon: CircleHelp, label: 'Help' },
  { to: '/staff', icon: UsersRound, label: 'Staff preview' },
]

const compactNavigation: NavigationItem[] = [
  { ...desktopNavigation[0], label: 'Explore' },
  desktopNavigation[1],
  desktopNavigation[2],
  desktopNavigation[6],
]

const menuNavigation: NavigationItem[] = [
  { ...desktopNavigation[0], label: 'Explore' },
  ...desktopNavigation.slice(1),
  { to: '/profile', icon: UserRound, label: 'Profile' },
]

function NavigationLinks({ items = desktopNavigation }: { items?: NavigationItem[] }) {
  return <Localize>{items.map(({ to, icon: Icon, label }) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `ui-transition flex min-h-11 items-center gap-3 rounded-control px-4 text-caption font-semibold ${isActive ? 'bg-brand-soft text-brand' : 'text-text-secondary hover:bg-brand-soft hover:text-brand'}`
      }
    >
      <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
      <span>{label}</span>
    </NavLink>
  ))}</Localize>
}

function useSignOut() {
  const { logout } = useAuth()
  const { translate } = useLanguage()
  const navigate = useNavigate()

  return async function signOut() {
    const confirmed = await showAlert.confirm(
      translate('Sign out?'),
      translate('You will need to sign in again to access private LostLink features.'),
      translate('Sign out'),
      translate('Stay signed in'),
    )
    if (!confirmed) return

    try {
      await logout()
      await showAlert.success(translate('Signed out'), translate('Your LostLink session has ended.'))
    } catch {
      await showAlert.error(
        translate('Sign-out incomplete'),
        translate('The local session was cleared, but the server could not confirm logout. Close the browser if this is a shared device.'),
      )
    } finally {
      void navigate('/login', { replace: true })
    }
  }
}

function HeaderAction({ icon: Icon, label, to }: NavigationItem) {
  return <Localize><Link to={to} aria-label={label} className="ui-transition flex size-11 items-center justify-center rounded-control text-text-secondary hover:bg-brand-soft hover:text-brand"><Icon aria-hidden="true" className="size-5" /></Link></Localize>
}

export function AccountMenu() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const signOut = useSignOut()

  useEffect(() => {
    if (!open) return

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <Localize><div ref={menuRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Profile"
        aria-expanded={open}
        aria-controls="account-dropdown"
        onClick={() => setOpen((current) => !current)}
        className="ui-transition flex min-h-11 items-center justify-center gap-1 rounded-control px-2 text-text-secondary hover:bg-brand-soft hover:text-brand"
      >
        <UserRound aria-hidden="true" className="size-5" />
        <ChevronDown aria-hidden="true" className={`ui-transition size-3.5 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div id="account-dropdown" className="absolute right-0 top-[calc(100%+0.5rem)] z-overlay w-64 rounded-card border border-border bg-surface p-2 shadow-floating">
          <div className="grid gap-1">
            <Link to="/profile" onClick={() => setOpen(false)} className="ui-transition flex min-h-11 items-center gap-3 rounded-control px-3 text-caption font-semibold text-text-primary hover:bg-brand-soft hover:text-brand">
              <UserRound aria-hidden="true" className="size-4" />Profile
            </Link>
            <button type="button" onClick={() => { setOpen(false); void signOut() }} className="ui-transition flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-left text-caption font-semibold text-error-strong hover:bg-error/10">
              <LogOut aria-hidden="true" className="size-4" />Sign out
            </button>
          </div>
        </div>
      )}
    </div></Localize>
  )
}

export function MobileNavigation() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const signOut = useSignOut()

  function closeMenu(returnFocus = true) {
    setOpen(false)
    if (returnFocus) window.requestAnimationFrame(() => triggerRef.current?.focus())
  }

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        window.requestAnimationFrame(() => triggerRef.current?.focus())
        return
      }
      if (event.key !== 'Tab') return

      const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])
      const first = focusable[0]
      const last = focusable.at(-1)
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <Localize>
      {open && (
        <div key="mobile-menu-overlay" className="fixed inset-0 z-overlay lg:hidden">
          <button type="button" tabIndex={-1} aria-label="Dismiss menu" onClick={() => closeMenu()} className="absolute inset-0 cursor-default bg-text-primary/20 backdrop-blur-[2px]" />
          <GlassSurface
            ref={panelRef}
            id="mobile-navigation-menu"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
            className="safe-area-bottom absolute inset-x-3 bottom-[calc(var(--layout-mobile-nav)+env(safe-area-inset-bottom)+1rem)] max-h-[calc(100dvh-var(--layout-mobile-nav)-env(safe-area-inset-bottom)-2.5rem)] overflow-y-auto rounded-overlay bg-surface/95 p-4 shadow-floating md:left-1/2 md:right-auto md:w-[calc(100%-3rem)] md:max-w-2xl md:-translate-x-1/2 md:p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-label font-bold uppercase tracking-label text-brand">All destinations</p>
                <h2 id="mobile-menu-title" className="mt-1 text-card font-bold text-text-primary">Menu</h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                aria-label="Close menu"
                onClick={() => closeMenu()}
                className="ui-transition flex size-11 shrink-0 items-center justify-center rounded-control text-text-secondary hover:bg-brand-soft hover:text-brand"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <nav aria-label="All destinations" className="mt-4 grid grid-cols-3 gap-2 md:gap-3">
              {menuNavigation.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => `pressable ui-transition flex min-h-20 flex-col items-center justify-center gap-2 rounded-card border px-2 py-3 text-center text-label font-semibold ${isActive ? 'border-brand/20 bg-brand-soft text-brand' : 'border-border bg-surface text-text-secondary hover:border-brand/20 hover:bg-brand-soft hover:text-brand'}`}
                >
                  <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
            <button
              type="button"
              onClick={() => { setOpen(false); void signOut() }}
              className="ui-transition mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 font-semibold text-error-strong hover:bg-error/10"
            >
              <LogOut aria-hidden="true" className="size-4" />Sign out
            </button>
          </GlassSurface>
        </div>
      )}
      <GlassSurface key="mobile-primary-navigation" className={`safe-area-bottom fixed bottom-2 left-1/2 w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-feature shadow-floating lg:hidden md:max-w-2xl ${open ? 'z-dialog' : 'z-navigation'}`}>
        <nav aria-label="Mobile primary" className="flex min-h-(--layout-mobile-nav) items-center px-2">
          {compactNavigation.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `ui-transition flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-control px-1 text-label font-semibold ${isActive ? 'bg-brand-soft text-brand' : 'text-text-secondary hover:bg-brand-soft hover:text-brand'}`}
            >
              <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
              <span className="max-w-full truncate">{label}</span>
            </NavLink>
          ))}
          <button
            ref={triggerRef}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="mobile-navigation-menu"
            onClick={() => setOpen((current) => !current)}
            className={`ui-transition flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-control px-1 text-label font-semibold ${open ? 'bg-brand-soft text-brand' : 'text-text-secondary hover:bg-brand-soft hover:text-brand'}`}
          >
            <LayoutGrid aria-hidden="true" className="size-5" strokeWidth={2} />
            <span>Menu</span>
          </button>
        </nav>
      </GlassSurface>
    </Localize>
  )
}

export function LanguageToggle() {
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
          className={`ui-transition flex min-h-8 min-w-8 items-center justify-center rounded-small px-2 text-label font-bold ${language === option ? 'bg-brand text-on-brand' : ''}`}
        >
          {option.toUpperCase()}
        </span>
      ))}
    </button>
  )
}

export function AppShell() {
  return (
    <Localize><div className="app-backdrop min-h-screen overflow-x-clip">
      <a href="#main-content" className="fixed left-4 top-4 z-toast -translate-y-24 rounded-control bg-brand px-4 py-3 font-semibold text-on-brand focus-visible:translate-y-0">Skip to content</a>
      <div className="app-shell-grid min-h-screen lg:grid">
        <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto border-r border-border bg-surface/95 px-5 py-5 shadow-card lg:flex xl:px-6 xl:py-6">
          <BrandMark />
          <nav aria-label="Primary" className="mt-8 grid gap-1.5"><NavigationLinks /></nav>
          <div className="mt-auto rounded-card border border-brand/10 bg-brand-soft/55 p-4">
            <p className="text-label font-bold uppercase tracking-label text-brand">Privacy first</p>
            <p className="mt-2 text-label leading-5 text-text-secondary-strong">Discovery stays separate from private ownership evidence.</p>
          </div>
        </aside>
        <div className="min-w-0">
          <GlassSurface className="safe-area-top sticky top-0 z-navigation h-(--layout-topbar) rounded-none border-x-0 border-t-0 shadow-card">
            <header className="mx-auto flex h-full max-w-content items-center justify-between px-5 md:px-7 lg:px-8 xl:px-10">
              <div className="lg:hidden"><BrandMark compact /></div>
              <p className="hidden text-caption font-medium text-text-secondary lg:block">University lost &amp; found</p>
              <div className="flex items-center gap-1">
                <LanguageToggle />
                <div className="hidden md:block"><HeaderAction to="/notifications" icon={Bell} label="Notifications" /></div>
                <div className="hidden lg:block"><AccountMenu /></div>
              </div>
            </header>
          </GlassSurface>
          <Outlet />
        </div>
      </div>
      <MobileNavigation />
    </div></Localize>
  )
}
