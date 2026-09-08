import { HeartHandshake, SearchCheck, ShieldCheck } from 'lucide-react'

const principles = [
  { icon: SearchCheck, title: 'Similarity assists discovery', detail: 'Image and text signals may rank possible matches.' },
  { icon: ShieldCheck, title: 'Verification stays private', detail: 'Ownership evidence is handled in a separate protected flow.' },
  { icon: HeartHandshake, title: 'Humans make the decision', detail: 'Staff review and accountable pickup close the loop.' },
]

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Project foundation</p>
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">Lost items deserve a clear path home.</h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">LostLink is being built for university communities. Product workflows are intentionally not enabled in this bootstrap.</p>
      <section aria-label="LostLink principles" className="mt-12 grid gap-4 md:grid-cols-3">
        {principles.map(({ icon: Icon, title, detail }) => (
          <article className="rounded-2xl border border-emerald-950/10 bg-white p-6 shadow-sm" key={title}>
            <Icon aria-hidden="true" className="mb-5 text-emerald-700" size={28} />
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{detail}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

