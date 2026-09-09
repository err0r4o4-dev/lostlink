import { Search } from 'lucide-react'
import { forwardRef, type InputHTMLAttributes } from 'react'

import { cn } from '../../lib/utils'

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { className, label, ...props },
  ref,
) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <span
        className={cn(
          'ui-transition flex min-h-12 items-center gap-3 rounded-control border border-border bg-surface px-4 shadow-card focus-within:border-brand',
          props.disabled && 'bg-surface-secondary text-text-tertiary shadow-none',
          className,
        )}
      >
        <Search aria-hidden="true" className="size-5 shrink-0 text-text-tertiary" />
        <input
          ref={ref}
          type="search"
          className="min-w-0 flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-secondary disabled:cursor-not-allowed"
          {...props}
        />
      </span>
    </label>
  )
})
