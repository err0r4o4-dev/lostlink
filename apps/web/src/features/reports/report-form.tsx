import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Eye, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { FileUpload } from '../../components/file-upload'
import { Button, Card, Checkbox, Input, IntegrationNotice, Notice, Textarea } from '../../components/ui'
import { Localize } from '../../i18n/language'
import { ApiError } from '../../api/client'
import { useAuth } from '../auth/auth-state'
import { createReport, type ReportRecord } from './report-api'

const reportSchema = z.object({
  itemName: z.string().trim().min(2, 'Enter a clear item name.').max(100, 'Keep the item name under 100 characters.'),
  category: z.string().trim().min(2, 'Enter an item category.').max(80, 'Keep the category under 80 characters.'),
  description: z.string().trim().min(10, 'Add enough public-safe detail to support discovery.').max(1000, 'Keep the description under 1,000 characters.'),
  eventDate: z.string().min(1, 'Choose a date.'),
  approximateTime: z.string(),
  location: z.string().trim().min(2, 'Enter a campus area or other approximate location.').max(120, 'Keep the location under 120 characters.'),
  identifyingDetails: z.string().trim().max(1000, 'Keep identifying details under 1,000 characters.'),
  privacyAcknowledged: z.literal(true, { error: 'Confirm that private ownership evidence is kept out of public details.' }),
})

type ReportValues = z.infer<typeof reportSchema>

interface ReportFormProps {
  reportType: 'lost' | 'found'
}

export function ReportForm({ reportType }: ReportFormProps) {
  const [reviewValues, setReviewValues] = useState<ReportValues>()
  const [created, setCreated] = useState<ReportRecord>()
  const [submitError, setSubmitError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const { accessToken } = useAuth()
  const { formState: { errors }, handleSubmit, register } = useForm<ReportValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { approximateTime: '', identifyingDetails: '' },
  })
  const eventVerb = reportType === 'lost' ? 'lost' : 'found'

  async function submitReport() {
    if (!reviewValues || !accessToken) return
    setIsSubmitting(true)
    setSubmitError(undefined)
    try {
      const response = await createReport({
        report_type: reportType,
        item_name: reviewValues.itemName,
        category: reviewValues.category,
        public_description: reviewValues.description,
        event_date: reviewValues.eventDate,
        approximate_time: reviewValues.approximateTime,
        approximate_location: reviewValues.location,
      }, accessToken, idempotencyKey)
      setCreated(response.report)
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : 'Report submission is temporarily unavailable.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (created) {
    return <Notice announce title="Report submitted" tone="success">Your {created.report_type} report reference is <span className="font-semibold">{created.id}</span>. Private identifying details and the local image preview were not uploaded.</Notice>
  }

  if (reviewValues) {
    const rows = [
      ['Item', reviewValues.itemName],
      ['Category', reviewValues.category],
      [`Date ${eventVerb}`, reviewValues.eventDate],
      ['Approximate time', reviewValues.approximateTime || 'Not provided'],
      ['Approximate location', reviewValues.location],
      ['Public description', reviewValues.description],
      ['Private verification detail', reviewValues.identifyingDetails || 'Not provided'],
    ]

    return (
      <Localize><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="p-5 md:p-7">
          <div className="flex items-center gap-3"><Eye aria-hidden="true" className="size-6 text-brand" /><h2 className="text-section font-semibold">Review your report</h2></div>
          <dl className="mt-6 divide-y divide-border">
            {rows.map(([label, value]) => (
              <div className="grid gap-1 py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-5" key={label}>
                <dt className="text-caption font-semibold text-text-secondary">{label}</dt>
                <dd className="min-w-0 whitespace-pre-wrap text-caption text-text-primary">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setReviewValues(undefined)}><ArrowLeft aria-hidden="true" className="size-4" />Edit report</Button>
            <Button disabled={isSubmitting || !accessToken} onClick={() => void submitReport()}>{isSubmitting ? 'Submitting…' : 'Submit report'}</Button>
          </div>
          {submitError && <div className="mt-5"><Notice announce title="Submission failed" tone="error">{submitError}</Notice></div>}
        </Card>
        <div className="space-y-4">
          <Notice title="Private fields stay local" tone="warning">Private identifying details and the image preview are not part of the report API and will not be sent.</Notice>
        </div>
      </div></Localize>
    )
  }

  return (
    <Localize><form onSubmit={(event) => void handleSubmit(setReviewValues)(event)} noValidate className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="space-y-6 p-5 md:p-7">
        <div>
          <h2 className="text-section font-semibold">Item information</h2>
          <p className="mt-2 text-caption text-text-secondary">Use public-safe details that help someone recognize the item.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Input label="Item name" required placeholder="e.g. black water bottle" error={errors.itemName?.message} {...register('itemName')} />
          <Input label="Category" required placeholder="e.g. electronics, keys, clothing" error={errors.category?.message} {...register('category')} />
        </div>
        <Textarea label="Public description" required placeholder="Describe appearance, color, material, or visible condition." error={errors.description?.message} {...register('description')} />
        <div className="grid gap-5 md:grid-cols-3">
          <Input label={`Date ${eventVerb}`} type="date" required error={errors.eventDate?.message} {...register('eventDate')} />
          <Input label="Approximate time" type="time" description="Optional" error={errors.approximateTime?.message} {...register('approximateTime')} />
          <Input label="Approximate location" required placeholder="Campus area or building" error={errors.location?.message} {...register('location')} />
        </div>
        <div>
          <h2 className="text-section font-semibold">Item photo</h2>
          <p className="mb-4 mt-2 text-caption text-text-secondary">The preview remains local. Uploading will require the private storage API.</p>
          <FileUpload />
        </div>
        <Textarea
          label="Private identifying characteristics"
          description="Optional. Intended for the protected verification flow; never include this in public matching data."
          placeholder="Distinctive marks or details that should remain private"
          error={errors.identifyingDetails?.message}
          {...register('identifyingDetails')}
        />
        <Checkbox
          label="I kept contact information and private ownership evidence out of the public description."
          error={errors.privacyAcknowledged?.message}
          {...register('privacyAcknowledged')}
        />
        <div className="flex justify-end"><Button type="submit">Review report</Button></div>
      </Card>
      <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
        <Notice title="Privacy boundary"><ShieldCheck aria-hidden="true" className="mr-1 inline size-4" />Public discovery details and private ownership evidence remain separate.</Notice>
        <IntegrationNotice capability="Private image upload and identifying-evidence storage" />
      </aside>
    </form></Localize>
  )
}
