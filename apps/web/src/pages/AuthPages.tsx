import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, UserPlus } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

import { BrandMark } from '../components/brand-mark'
import { Button, Card, Checkbox, Input, IntegrationNotice, LoadingState, Notice, PageContainer, PageHeader, buttonVariants } from '../components/ui'
import { ApiError } from '../api/client'
import { useAuth } from '../features/auth/auth-state'
import { useLanguage } from '../i18n/language'
import { showAlert } from '../lib/alert'

const identifierSchema = z.object({ identifier: z.string().trim().min(3, 'Use at least 3 characters.').max(254, 'Keep the identifier under 255 characters.') })
const loginSchema = identifierSchema.extend({ password: z.string().min(1, 'Enter your password.') })
const registerSchema = identifierSchema.extend({ password: z.string().min(12, 'Use at least 12 characters.').max(128, 'Keep the password under 129 characters.'), confirmPassword: z.string().min(1, 'Confirm your password.') }).refine((values) => values.password === values.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] })
const resetSchema = z.object({ token: z.string().trim().min(1, 'Enter the recovery token.'), password: z.string().min(1, 'Enter a new password.'), confirmPassword: z.string().min(1, 'Confirm the new password.') }).refine((values) => values.password === values.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] })

function AuthLayout({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  return (
    <PageContainer>
      <div className="mx-auto max-w-lg"><div className="mb-8 flex justify-center"><BrandMark /></div><Card elevated className="p-5 md:p-8"><h1 className="text-page-mobile font-semibold tracking-tight md:text-page">{title}</h1><p className="mt-3 text-caption text-text-secondary">{description}</p><div className="mt-7">{children}</div></Card></div>
    </PageContainer>
  )
}

function GoogleSignInLink() {
  return <a className={buttonVariants({ variant: 'secondary', className: 'w-full' })} href="/api/v1/auth/google/start"><span aria-hidden="true" className="text-card font-bold">G</span>Continue with Google</a>
}

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string>()
  const { authenticate } = useAuth()
  const { translate } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const { formState: { errors, isSubmitting }, handleSubmit, register } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) })
  const submit = handleSubmit(async (values) => {
    setServerError(undefined)
    try {
      await authenticate('login', values)
      await showAlert.success(translate('Signed in successfully'), translate('Welcome back to LostLink.'))
      const requested = (location.state as { from?: string } | null)?.from
      void navigate(requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/profile', { replace: true })
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Sign in is temporarily unavailable.'
      setServerError(errorMessage)
      await showAlert.error(translate('Sign in failed'), translate(errorMessage))
    }
  })
  return (
    <AuthLayout title="Sign in to LostLink" description="Authentication is required before private reports, claims, tracking, or staff tools can be accessed.">
      <form className="space-y-5" noValidate onSubmit={(event) => void submit(event)}>
        <Input label="University email or account identifier" autoComplete="username" required error={errors.identifier?.message} {...register('identifier')} />
        <Input label="Password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required error={errors.password?.message} {...register('password')} />
        <Checkbox label="Show password" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
        {serverError && <Notice announce title="Sign in failed" tone="error">{serverError}</Notice>}
        <div className="flex flex-wrap items-center justify-between gap-3"><Link to="/forgot-password" className="min-h-11 py-3 text-caption font-semibold text-brand">Forgot password?</Link><Button disabled={isSubmitting} type="submit">{isSubmitting ? 'Signing in…' : 'Sign in'} <ArrowRight aria-hidden="true" className="size-4" /></Button></div>
      </form>
      <div className="my-6 flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-border" /><span className="text-label text-text-secondary">or</span><span className="h-px flex-1 bg-border" /></div>
      <GoogleSignInLink />
      <p className="mt-6 text-center text-caption text-text-secondary">Need an account? <Link className="font-semibold text-brand" to="/register">Create one</Link></p>
    </AuthLayout>
  )
}

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string>()
  const { authenticate } = useAuth()
  const { translate } = useLanguage()
  const navigate = useNavigate()
  const { formState: { errors, isSubmitting }, handleSubmit, register } = useForm<z.infer<typeof registerSchema>>({ resolver: zodResolver(registerSchema) })
  const submit = handleSubmit(async (values) => {
    setServerError(undefined)
    try {
      await authenticate('register', { identifier: values.identifier, password: values.password })
      await showAlert.success(translate('Account created'), translate('Your LostLink account is ready.'))
      void navigate('/onboarding', { replace: true })
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Registration is temporarily unavailable.'
      setServerError(errorMessage)
      await showAlert.error(translate('Registration failed'), translate(errorMessage))
    }
  })
  return (
    <AuthLayout title="Create your account" description="Create a basic LostLink account. Additional identity fields require a separately approved API contract.">
      <form className="space-y-5" noValidate onSubmit={(event) => void submit(event)}>
        <Input label="University email or account identifier" autoComplete="username" required error={errors.identifier?.message} {...register('identifier')} />
        <Input label="Password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required description="Use 12–128 characters." error={errors.password?.message} {...register('password')} />
        <Input label="Confirm password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Checkbox label="Show passwords" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
        {serverError && <Notice announce title="Registration failed" tone="error">{serverError}</Notice>}
        <Button className="w-full" disabled={isSubmitting} type="submit"><UserPlus aria-hidden="true" className="size-4" />{isSubmitting ? 'Creating account…' : 'Create account'}</Button>
      </form>
      <div className="my-6 flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-border" /><span className="text-label text-text-secondary">or</span><span className="h-px flex-1 bg-border" /></div>
      <GoogleSignInLink />
      <p className="mt-6 text-center text-caption text-text-secondary">Already registered? <Link className="font-semibold text-brand" to="/login">Sign in</Link></p>
    </AuthLayout>
  )
}

export function GoogleAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const { isLoading, user } = useAuth()
  if (searchParams.has('error')) {
    return <AuthLayout title="Google sign-in failed" description="The Google identity response could not be verified."><Notice announce title="Authentication failed" tone="error">Try again from the sign-in page. No Google token was stored.</Notice><Link className={buttonVariants({ variant: 'secondary', className: 'mt-5 w-full' })} to="/login">Back to sign in</Link></AuthLayout>
  }
  if (isLoading) return <AuthLayout title="Completing sign-in" description="LostLink is creating your local session."><LoadingState label="Verifying your session" /></AuthLayout>
  if (user) return <Navigate to="/profile" replace />
  return <AuthLayout title="Google sign-in failed" description="A local session could not be created."><Notice announce title="Authentication failed" tone="error">Try again from the sign-in page.</Notice></AuthLayout>
}

export function ForgotPasswordPage() {
  const [attempted, setAttempted] = useState(false)
  const { formState: { errors }, handleSubmit, register } = useForm<z.infer<typeof identifierSchema>>({ resolver: zodResolver(identifierSchema) })
  const submit = handleSubmit(() => setAttempted(true))
  return <AuthLayout title="Recover account access" description="Recovery responses remain generic so the interface does not reveal whether an account exists."><form className="space-y-5" onSubmit={(event) => void submit(event)} noValidate><Input label="University email or account identifier" autoComplete="username" required error={errors.identifier?.message} {...register('identifier')} /><Button className="w-full" type="submit"><KeyRound aria-hidden="true" className="size-4" />Request recovery</Button></form>{attempted && <div className="mt-5"><IntegrationNotice announce capability="Rate-limited account recovery and secure delivery" /></div>}<p className="mt-6 text-center"><Link className="text-caption font-semibold text-brand" to="/login">Back to sign in</Link></p></AuthLayout>
}

export function ResetPasswordPage() {
  const [attempted, setAttempted] = useState(false)
  const { formState: { errors }, handleSubmit, register } = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) })
  const submit = handleSubmit(() => setAttempted(true))
  return <AuthLayout title="Set a new password" description="A server-validated recovery token is required before any credential can change."><form className="space-y-5" onSubmit={(event) => void submit(event)} noValidate><Input label="Recovery token" autoComplete="one-time-code" required error={errors.token?.message} {...register('token')} /><Input label="New password" type="password" autoComplete="new-password" required error={errors.password?.message} {...register('password')} /><Input label="Confirm new password" type="password" autoComplete="new-password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} /><Button className="w-full" type="submit"><LockKeyhole aria-hidden="true" className="size-4" />Review password reset</Button></form>{attempted && <div className="mt-5"><IntegrationNotice announce capability="Recovery-token validation, password update, and session revocation" /></div>}</AuthLayout>
}

export function OnboardingPage() {
  return (
    <PageContainer>
      <PageHeader eyebrow="Before you begin" title="Privacy-conscious by design" description="This orientation uses approved architecture language and does not replace future legal or institutional consent copy." />
      <div className="grid gap-5 md:grid-cols-3"><Card className="p-5"><Eye aria-hidden="true" className="size-7 text-brand" /><h2 className="mt-4 text-card font-semibold">Share public-safe details</h2><p className="mt-2 text-caption text-text-secondary">Descriptions and coarse locations should help discovery without publishing contact data or ownership secrets.</p></Card><Card className="p-5"><ShieldCheck aria-hidden="true" className="size-7 text-brand" /><h2 className="mt-4 text-card font-semibold">Keep evidence private</h2><p className="mt-2 text-caption text-text-secondary">Receipts, serial secrets, ownership answers, and staff notes belong in restricted flows.</p></Card><Card className="p-5"><EyeOff aria-hidden="true" className="size-7 text-brand" /><h2 className="mt-4 text-card font-semibold">Treat AI as assistance</h2><p className="mt-2 text-caption text-text-secondary">Similarity ranks potential matches; authorized human review remains responsible for ownership decisions.</p></Card></div>
      <div className="mt-5"><Notice title="Consent integration pending" tone="warning">No legal acknowledgement is collected because approved consent text, versioning, retention, and backend storage do not yet exist.</Notice></div>
    </PageContainer>
  )
}
