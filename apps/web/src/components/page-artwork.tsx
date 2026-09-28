import type { LucideIcon } from 'lucide-react'

interface PageArtworkProps {
  icon: LucideIcon
  satellites?: LucideIcon[]
}

export function PageArtwork({ icon: Icon, satellites = [] }: PageArtworkProps) {
  return (
    <div aria-hidden="true" className="relative h-24 w-48">
      <span className="absolute left-14 top-1 flex size-20 rotate-3 items-center justify-center rounded-overlay border border-white/80 bg-surface/90 text-brand shadow-floating">
        <Icon className="size-10" strokeWidth={1.7} />
      </span>
      {satellites.slice(0, 2).map((Satellite, index) => (
        <span
          key={index}
          className={`absolute flex size-11 items-center justify-center rounded-control border border-white/80 bg-surface/90 text-brand shadow-card ${index === 0 ? 'left-1 top-8 -rotate-6' : 'right-0 top-10 rotate-6'}`}
        >
          <Satellite className="size-5" />
        </span>
      ))}
      <span className="absolute bottom-0 left-8 h-6 w-36 rounded-pill bg-brand-soft/70 blur-lg" />
    </div>
  )
}
