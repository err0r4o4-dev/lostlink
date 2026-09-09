import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'ui-transition pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 py-3 text-caption font-semibold outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-on-brand shadow-card hover:bg-brand-hover active:bg-brand-active',
        secondary: 'border border-border bg-surface text-brand hover:bg-brand-soft',
        ghost: 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary',
        danger: 'bg-error-strong text-on-brand hover:bg-error-strong/90',
      },
      size: {
        default: '',
        compact: 'px-4 py-2',
        icon: 'size-11 px-0 py-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)
