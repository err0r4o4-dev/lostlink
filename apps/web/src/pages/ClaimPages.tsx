import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Download, FileLock2, SearchCheck, ShieldCheck, Trash2, UserCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

import { apiErrorMessage } from '../api/error'
import { FileUpload } from '../components/file-upload'
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, Notice, PageContainer, PageHeader, StatusBadge, Textarea, buttonVariants } from '../components/ui'
import { useAuth } from '../features/auth/auth-state'
import {
  addClaimImage,
  addClaimStatement,
  cancelClaim,
  createClaim,
  deleteClaimEvidence,
  getClaim,
  getClaimEvidenceContent,
  listMyClaims,
  respondToClaim,
  submitClaim,
  type ClaimEvidence,
} from '../features/claims/claim-api'
import { showAlert } from '../lib/alert'

const claimSchema = z.object({
  ownershipDetails: z.string().trim().min(10, 'Describe private ownership details for staff review.').max(2000, 'Keep the response under 2,000 characters.'),
})

type ClaimValues = z.infer<typeof claimSchema>

const verificationGuide = [
  { icon: SearchCheck, title: 'Review candidate', detail: 'Confirm that the public-safe description could relate to your item.' },
  { icon: FileLock2, title: 'Provide private evidence', detail: 'Ownership details remain separate from discovery and matching data.' },
  { icon: UserCheck, title: 'Staff review', detail: 'Authorized staff—not a similarity score—make the ownership decision.' },
  { icon: CheckCircle2, title: 'Arrange return', detail: 'Pickup and closure happen only after the authoritative workflow approves them.' },
]

export function ClaimsPage() {
  const { request } = useAuth()
  const claims = useQuery({ queryKey: ['claims', 'mine'], queryFn: () => listMyClaims(request) })

  return (
    <PageContainer>
      <PageHeader eyebrow="Ownership workflow" title="My claims" description="Review drafts, submitted evidence, staff decisions, and the next authorized action." />
      {claims.isPending && <LoadingState label="Loading claims" />}
      {claims.isError && <ErrorState title="Claims unavailable" description="Your claims could not be loaded." onRetry={() => void claims.refetch()} />}
      {claims.data && !claims.data.claims.length && <EmptyState icon={FileLock2} title="No claims yet" description="Start a claim from a potential match when you recognize an item that may be yours." />}
      {claims.data && claims.data.claims.length > 0 && <div className="grid gap-4 md:grid-cols-2">{claims.data.claims.map((claim) => <Card className="p-5" key={claim.id}><div className="flex flex-wrap gap-2"><StatusBadge>{claim.status}</StatusBadge><Badge>{claim.id}</Badge></div><p className="mt-4 text-caption text-text-secondary">Match {claim.match_id}</p><p className="mt-2 text-label text-text-secondary">Updated {new Date(claim.updated_at).toLocaleString()}</p><Link to={`/claims/${encodeURIComponent(claim.id)}`} className={`${buttonVariants({ variant: 'secondary' })} mt-5`}>Open claim</Link></Card>)}</div>}
    </PageContainer>
  )
}

export function NewClaimPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { request } = useAuth()
  const [reviewValues, setReviewValues] = useState<ClaimValues>()
  const [image, setImage] = useState<File | null>(null)
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const matchId = searchParams.get('match') ?? ''
  const { formState: { errors }, handleSubmit, register } = useForm<ClaimValues>({ resolver: zodResolver(claimSchema) })
  const create = useMutation({
    mutationFn: async (values: ClaimValues) => {
      const { claim } = await createClaim(request, matchId, idempotencyKey)
      let evidenceError: unknown
      try {
        await addClaimStatement(request, claim.id, values.ownershipDetails)
      } catch (error) {
        evidenceError = error
      }
      if (image) {
        try {
          await addClaimImage(request, claim.id, 'Supporting ownership image', image)
        } catch (error) {
          evidenceError ??= error
        }
      }
      return { claim, evidenceError }
    },
    onSuccess: async ({ claim, evidenceError }) => {
      if (evidenceError) {
        await showAlert.info('Claim draft created', 'Some evidence could not be saved. Open the draft and add the missing evidence before submitting it.')
      } else {
        await showAlert.success('Claim draft created', 'Your private evidence was saved. Review the draft before submitting it to staff.')
      }
      void navigate(`/claims/${encodeURIComponent(claim.id)}`)
    },
  })

  return (
    <PageContainer>
      <PageHeader eyebrow="Ownership verification" title="Start a claim" description="Provide private evidence for authorized staff review. Match similarity is never treated as proof." />
      {!matchId ? <Notice title="Match reference required" tone="warning">Open a potential match and choose “Start private claim” before creating ownership evidence.</Notice> : <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="p-5 md:p-7">
          {reviewValues ? <div><Badge variant="brand">Private draft review</Badge><h2 className="mt-4 text-section font-semibold">Review ownership evidence</h2><dl className="mt-6 divide-y divide-border text-caption"><div className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]"><dt className="font-semibold text-text-secondary">Match reference</dt><dd className="break-all">{matchId}</dd></div><div className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]"><dt className="font-semibold text-text-secondary">Ownership details</dt><dd className="whitespace-pre-wrap">{reviewValues.ownershipDetails}</dd></div><div className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]"><dt className="font-semibold text-text-secondary">Supporting image</dt><dd>{image ? image.name : 'Not provided'}</dd></div></dl><div className="mt-6 flex flex-wrap gap-3"><Button variant="secondary" onClick={() => setReviewValues(undefined)}>Edit evidence</Button><Button disabled={create.isPending} onClick={() => create.mutate(reviewValues)}>{create.isPending ? 'Creating draft…' : 'Create claim draft'}</Button></div>{create.isError && <div className="mt-5"><Notice announce title="Claim could not be created" tone="error">{apiErrorMessage(create.error, 'The claim workflow is temporarily unavailable.')}</Notice></div>}</div> : <form className="space-y-6" onSubmit={(event) => void handleSubmit(setReviewValues)(event)} noValidate><div><p className="text-caption font-semibold text-text-secondary">Potential-match reference</p><p className="mt-1 break-all text-caption">{matchId}</p></div><Textarea label="Private ownership details" required description="These details are sent only to the restricted claim workflow." placeholder="Describe details that an owner would reasonably know" error={errors.ownershipDetails?.message} {...register('ownershipDetails')} /><div><h2 className="text-card font-semibold">Supporting ownership image</h2><p className="mb-4 mt-2 text-caption text-text-secondary">Optional JPEG or PNG evidence is sanitized and stored separately from public report images.</p><FileUpload onChange={setImage} /></div><Button type="submit">Review claim</Button></form>}
        </Card>
        <aside className="space-y-4"><Notice title="Restricted evidence"><ShieldCheck aria-hidden="true" className="mr-1 inline size-4" />Evidence is visible only to the claimant and authorized staff. It never enters matching.</Notice><Link to="/claims" className={buttonVariants({ variant: 'secondary', className: 'w-full' })}>View my claims</Link></aside>
      </div>}
    </PageContainer>
  )
}

export function ClaimDetailPage() {
  const { claimId } = useParams()
  const { request, requestBlob } = useAuth()
  const queryClient = useQueryClient()
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [uploadVersion, setUploadVersion] = useState(0)
  const claim = useQuery({ queryKey: ['claim', claimId], queryFn: () => getClaim(request, claimId ?? ''), enabled: Boolean(claimId) })
  const refresh = async () => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ['claim', claimId] }), queryClient.invalidateQueries({ queryKey: ['claims', 'mine'] })])
  }
  const addEvidence = useMutation({
    mutationFn: async () => image ? addClaimImage(request, claimId ?? '', description, image) : addClaimStatement(request, claimId ?? '', description),
    onSuccess: async () => { setDescription(''); setImage(null); setUploadVersion((value) => value + 1); await refresh() },
  })
  const respond = useMutation({ mutationFn: () => respondToClaim(request, claimId ?? '', description), onSuccess: async () => { setDescription(''); await refresh() } })
  const removeEvidence = useMutation({ mutationFn: (evidenceId: string) => deleteClaimEvidence(request, claimId ?? '', evidenceId), onSuccess: refresh })
  const submit = useMutation({ mutationFn: () => submitClaim(request, claimId ?? ''), onSuccess: async () => { await refresh(); await showAlert.success('Claim submitted', 'Authorized staff can now review the private evidence.') } })
  const cancel = useMutation({ mutationFn: () => cancelClaim(request, claimId ?? ''), onSuccess: refresh })
  const downloadEvidence = useMutation({
    mutationFn: async (evidence: ClaimEvidence) => {
      const blob = await getClaimEvidenceContent(requestBlob, claimId ?? '', evidence.id)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `claim-evidence-${evidence.id}.${evidence.content_type === 'image/png' ? 'png' : 'jpg'}`
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
    },
  })

  async function confirmCancel() {
    if (await showAlert.confirmDestructive('Cancel claim?', 'A cancelled claim cannot continue to staff review or return.', 'Cancel claim', 'Keep claim')) cancel.mutate()
  }

  const value = claim.data?.claim
  const actionError = addEvidence.error ?? respond.error ?? removeEvidence.error ?? downloadEvidence.error ?? submit.error ?? cancel.error
  const editable = value?.status === 'draft' || value?.status === 'needs_more_info'

  return (
    <PageContainer>
      <PageHeader eyebrow="Claim status" title={value ? `Claim ${value.status.replaceAll('_', ' ')}` : 'Claim details'} description="Private evidence, decisions, and status come from the authorized Go workflow." actions={<Link to="/claims" className={buttonVariants({ variant: 'secondary' })}>My claims</Link>} />
      {claim.isPending && <LoadingState label="Loading claim" />}
      {claim.isError && <ErrorState title="Claim unavailable" description="This claim does not exist or is not visible to the active account." onRetry={() => void claim.refetch()} />}
      {value && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]"><div className="space-y-5"><Card className="p-5 md:p-7"><div className="flex flex-wrap gap-2"><StatusBadge>{value.status}</StatusBadge><Badge>{value.id}</Badge></div><dl className="mt-6 grid gap-4 text-caption sm:grid-cols-2"><div><dt className="font-semibold text-text-secondary">Lost report</dt><dd className="mt-1 break-all">{value.lost_report_id}</dd></div><div><dt className="font-semibold text-text-secondary">Found report</dt><dd className="mt-1 break-all">{value.found_report_id}</dd></div></dl></Card><Card className="p-5 md:p-7"><h2 className="text-card font-semibold">Restricted evidence</h2>{!value.evidence?.length ? <div className="mt-5"><EmptyState icon={FileLock2} title="No evidence yet" description="Add a private statement or supporting image before submitting the claim." /></div> : <div className="mt-5 space-y-3">{value.evidence.map((evidence) => <div key={evidence.id} className="rounded-card border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><StatusBadge>{evidence.evidence_type}</StatusBadge><p className="mt-3 whitespace-pre-wrap text-caption">{evidence.description}</p></div><div className="flex gap-2">{evidence.evidence_type === 'image' && <Button variant="ghost" disabled={downloadEvidence.isPending} onClick={() => downloadEvidence.mutate(evidence)}><Download aria-hidden="true" className="size-4" />Download</Button>}{editable && <Button variant="ghost" disabled={removeEvidence.isPending} onClick={() => removeEvidence.mutate(evidence.id)}><Trash2 aria-hidden="true" className="size-4" />Delete</Button>}</div></div></div>)}</div>}{editable && <div className="mt-6 space-y-4"><Textarea label={value.status === 'needs_more_info' ? 'Response to staff' : 'Additional evidence'} minLength={10} maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} /><FileUpload key={uploadVersion} onChange={setImage} /><Button disabled={description.trim().length < 10 || addEvidence.isPending || respond.isPending} onClick={() => value.status === 'needs_more_info' && !image ? respond.mutate() : addEvidence.mutate()}>{addEvidence.isPending || respond.isPending ? 'Saving…' : 'Save evidence'}</Button></div>}</Card>{value.decisions && value.decisions.length > 0 && <Card className="p-5 md:p-7"><h2 className="text-card font-semibold">Staff decisions</h2><ol className="mt-5 space-y-4">{value.decisions.map((decision) => <li key={decision.id} className="rounded-card bg-surface-secondary p-4"><div className="flex flex-wrap gap-2"><StatusBadge>{decision.action}</StatusBadge><span className="text-label text-text-secondary">{new Date(decision.created_at).toLocaleString()}</span></div>{decision.reason && <p className="mt-2 text-caption">{decision.reason}</p>}</li>)}</ol></Card>}</div><aside className="space-y-4">{value.status === 'draft' && <Button className="w-full" disabled={!value.evidence?.length || submit.isPending} onClick={() => submit.mutate()}>{submit.isPending ? 'Submitting…' : 'Submit for staff review'}</Button>}{!['approved', 'rejected', 'cancelled'].includes(value.status) && <Button className="w-full" variant="secondary" disabled={cancel.isPending} onClick={() => void confirmCancel()}>Cancel claim</Button>}<Link to={`/tracking?reference=${encodeURIComponent(value.id)}`} className={buttonVariants({ variant: 'secondary', className: 'w-full' })}>Track this claim</Link><Notice title="Human decision boundary" tone="warning">A similarity score is not accepted as ownership evidence. Staff decisions use the restricted claim record.</Notice>{actionError && <Notice announce title="Action failed" tone="error">{apiErrorMessage(actionError, 'The claim action could not be completed.')}</Notice>}</aside></div>}
    </PageContainer>
  )
}

export function VerificationGuidePage() {
  return (
    <PageContainer>
      <PageHeader eyebrow="Process guide" title="How ownership verification works" description="A transparent boundary between discovery assistance and accountable ownership decisions." />
      <ol className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{verificationGuide.map(({ detail, icon: Icon, title }, index) => <li key={title}><Card className="h-full p-5"><span className="text-label font-semibold text-brand">STEP {index + 1}</span><Icon aria-hidden="true" className="mt-5 size-7 text-brand" /><h2 className="mt-4 text-card font-semibold">{title}</h2><p className="mt-2 text-caption text-text-secondary">{detail}</p></Card></li>)}</ol>
      <div className="mt-5 flex flex-wrap gap-3"><Link to="/matches" className={buttonVariants({ variant: 'primary' })}>Review potential matches</Link><Link to="/claims" className={buttonVariants({ variant: 'secondary' })}>View my claims</Link></div>
    </PageContainer>
  )
}
