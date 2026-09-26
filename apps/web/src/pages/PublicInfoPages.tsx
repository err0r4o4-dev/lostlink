import { FileText, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { buttonVariants } from '../components/ui'
import { Localize } from '../i18n/language'

function PublicInfoPage({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string
  title: string
  description: string
  icon: typeof ShieldCheck
}) {
  return (
    <Localize><main id="main-content" tabIndex={-1} className="mx-auto max-w-4xl px-5 py-16 focus:outline-none md:px-7 md:py-24">
      <span className="flex size-14 items-center justify-center rounded-feature bg-brand-soft text-brand">
        <Icon aria-hidden="true" className="size-7" />
      </span>
      <p className="mt-7 text-caption font-semibold text-brand">{eyebrow}</p>
      <h1 className="mt-2 text-page-mobile font-bold tracking-tight text-text-primary md:text-page">{title}</h1>
      <p className="mt-4 max-w-2xl text-body text-text-secondary">{description}</p>
      <p className="mt-5 max-w-2xl text-caption text-text-secondary">
        This page is not yet a complete formal policy or terms document. Please contact the LostLink administrators if you need additional information before production use.
      </p>
      <Link to="/" className={`${buttonVariants({ variant: 'secondary' })} mt-8`}>Return home</Link>
    </main></Localize>
  )
}

export function PrivacyPage() {
  return (
    <PublicInfoPage
      icon={ShieldCheck}
      eyebrow="Privacy"
      title="Privacy information"
      description="LostLink is currently preparing the formal policy explaining data purpose, access, retention, and deletion."
    />
  )
}

export function TermsPage() {
  return (
    <PublicInfoPage
      icon={FileText}
      eyebrow="Terms"
      title="Terms of use"
      description="LostLink is currently preparing the formal terms of use governing user rights, responsibilities, and verification processes."
    />
  )
}

