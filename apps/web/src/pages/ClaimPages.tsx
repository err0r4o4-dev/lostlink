import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, ClipboardCheck, FileLock2, SearchCheck, ShieldCheck, UserCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { z } from 'zod'

import { FileUpload } from '../components/file-upload'
import { Badge, Button, Card, Input, IntegrationNotice, Notice, PageContainer, PageHeader, Textarea } from '../components/ui'

const claimSchema = z.object({
  matchReference: z.string().trim().min(1, 'Enter the potential-match reference.'),
  ownershipDetails: z.string().trim().min(10, 'Describe private ownership details for staff review.').max(1500, 'Keep the response under 1,500 characters.'),
})

type ClaimValues = z.infer<typeof claimSchema>

const verificationGuide = [
  { icon: SearchCheck, title: 'Review candidate', detail: 'Confirm that the public-safe description could relate to your item.' },
  { icon: FileLock2, title: 'Provide private evidence', detail: 'Ownership details remain separate from discovery and matching data.' },
  { icon: UserCheck, title: 'Staff review', detail: 'Authorized staff—not a similarity score—make the ownership decision.' },
  { icon: CheckCircle2, title: 'Arrange return', detail: 'Pickup and closure happen only after the authoritative workflow approves them.' },
]

export function NewClaimPage() {
  const [reviewValues, setReviewValues] = useState<ClaimValues>()
  const { formState: { errors }, handleSubmit, register } = useForm<ClaimValues>({ resolver: zodResolver(claimSchema) })

  return (
    <PageContainer>
      <PageHeader eyebrow="Ownership verification" title="Start a claim" description="Provide private evidence for authorized staff review. Match similarity is never treated as proof." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="p-5 md:p-7">
          {reviewValues ? (
            <div>
              <Badge variant="brand">Frontend review</Badge>
              <h2 className="mt-4 text-section font-semibold">Review private evidence</h2>
              <dl className="mt-6 divide-y divide-border text-caption"><div className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]"><dt className="font-semibold text-text-secondary">Match reference</dt><dd>{reviewValues.matchReference}</dd></div><div className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]"><dt className="font-semibold text-text-secondary">Ownership details</dt><dd className="whitespace-pre-wrap">{reviewValues.ownershipDetails}</dd></div></dl>
              <div className="mt-6 flex flex-wrap gap-3"><Button variant="secondary" onClick={() => setReviewValues(undefined)}>Edit evidence</Button><Button disabled>Claim submission unavailable</Button></div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={(event) => void handleSubmit(setReviewValues)(event)} noValidate>
              <Input label="Potential-match reference" required placeholder="Reference supplied by the matching service" error={errors.matchReference?.message} {...register('matchReference')} />
              <Textarea label="Private ownership details" required description="Do not place these details in public item descriptions or matching explanations." placeholder="Describe details that an owner would reasonably know" error={errors.ownershipDetails?.message} {...register('ownershipDetails')} />
              <div><h2 className="text-card font-semibold">Supporting image or document preview</h2><p className="mb-4 mt-2 text-caption text-text-secondary">The current component creates a local image preview only. Nothing is uploaded.</p><FileUpload /></div>
              <Button type="submit">Review claim</Button>
            </form>
          )}
        </Card>
        <aside className="space-y-4"><Notice title="Restricted evidence"><ShieldCheck aria-hidden="true" className="mr-1 inline size-4" />Evidence must be authorized, retained, and deleted according to a future Go-owned policy.</Notice><IntegrationNotice capability="Claim submission, authorization, evidence upload, and workflow state" /></aside>
      </div>
    </PageContainer>
  )
}

export function ClaimDetailPage() {
  const { claimId } = useParams()
  return (
    <PageContainer>
      <PageHeader eyebrow="Claim status" title="Claim details are unavailable" description="No authenticated claim endpoint or workflow state exists in the current API." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="p-5 md:p-7"><div className="flex items-center gap-3"><ClipboardCheck aria-hidden="true" className="size-6 text-brand" /><h2 className="text-section font-semibold">Claim reference</h2></div><p className="mt-4 text-caption text-text-secondary">{claimId ?? 'No reference supplied'}</p><div className="mt-6"><Notice title="No authoritative state loaded" tone="warning">Draft, review, approval, rejection, cancellation, pickup, and closure states will be shown only when defined and returned by Go.</Notice></div></Card>
        <IntegrationNotice capability="Authorized claim retrieval and next-action guidance" />
      </div>
    </PageContainer>
  )
}

export function VerificationGuidePage() {
  return (
    <PageContainer>
      <PageHeader eyebrow="Process guide" title="How ownership verification works" description="A transparent boundary between discovery assistance and accountable ownership decisions." />
      <ol className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{verificationGuide.map(({ detail, icon: Icon, title }, index) => <li key={title}><Card className="h-full p-5"><span className="text-label font-semibold text-brand">STEP {index + 1}</span><Icon aria-hidden="true" className="mt-5 size-7 text-brand" /><h2 className="mt-4 text-card font-semibold">{title}</h2><p className="mt-2 text-caption text-text-secondary">{detail}</p></Card></li>)}</ol>
      <div className="mt-5"><IntegrationNotice capability="Ownership verification policy and staff decisions" /></div>
    </PageContainer>
  )
}
