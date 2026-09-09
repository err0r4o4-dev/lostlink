import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

import { cn } from '../../lib/utils'

const controlClassName =
  'ui-transition min-h-12 w-full rounded-control border border-border bg-surface px-4 text-body text-text-primary shadow-card outline-none placeholder:text-text-secondary focus:border-brand disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-tertiary disabled:shadow-none'

interface FieldShellProps {
  children: ReactNode
  description?: string
  error?: string
  htmlFor: string
  label: string
  required?: boolean
}

export function FieldShell({ children, description, error, htmlFor, label, required }: FieldShellProps) {
  const messageId = `${htmlFor}-message`

  return (
    <div>
      <label className="mb-2 block text-caption font-semibold text-text-primary" htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-1 text-error-strong" aria-hidden="true">*</span>}
      </label>
      {children}
      {(error || description) && (
        <p id={messageId} className={cn('mt-2 text-caption', error ? 'text-error-strong' : 'text-text-secondary')}>
          {error ?? description}
        </p>
      )}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  description?: string
  error?: string
  label: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, description, error, id: providedId, label, required, ...props },
  ref,
) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  return (
    <FieldShell description={description} error={error} htmlFor={id} label={label} required={required}>
      <input
        ref={ref}
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error || description ? `${id}-message` : undefined}
        className={cn(controlClassName, error && 'border-error-strong', className)}
        {...props}
      />
    </FieldShell>
  )
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  description?: string
  error?: string
  label: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, description, error, id: providedId, label, required, ...props },
  ref,
) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  return (
    <FieldShell description={description} error={error} htmlFor={id} label={label} required={required}>
      <textarea
        ref={ref}
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error || description ? `${id}-message` : undefined}
        className={cn(controlClassName, 'min-h-32 resize-y py-3', error && 'border-error-strong', className)}
        {...props}
      />
    </FieldShell>
  )
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  description?: string
  error?: string
  label: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { children, className, description, error, id: providedId, label, required, ...props },
  ref,
) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  return (
    <FieldShell description={description} error={error} htmlFor={id} label={label} required={required}>
      <select
        ref={ref}
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error || description ? `${id}-message` : undefined}
        className={cn(controlClassName, error && 'border-error-strong', className)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  )
})

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  description?: string
  error?: string
  label: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, description, error, id: providedId, label, ...props },
  ref,
) {
  const generatedId = useId()
  const id = providedId ?? generatedId
  return (
    <div>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-control p-2 text-caption text-text-primary">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className={cn('mt-1 size-5 shrink-0 accent-brand', className)}
          aria-describedby={error || description ? `${id}-message` : undefined}
          aria-invalid={Boolean(error)}
          {...props}
        />
        <span>{label}</span>
      </label>
      {(error || description) && <p id={`${id}-message`} className={cn('ml-10 text-caption', error ? 'text-error-strong' : 'text-text-secondary')}>{error ?? description}</p>}
    </div>
  )
})
